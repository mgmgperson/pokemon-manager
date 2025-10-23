import { Router, Request, Response } from 'express';
import { allItems } from '../data/item';
import { getActiveDB } from '../services/dbManager';

const router: Router = Router();


// Query for checking shop accessibility
const accessSql = `
    WITH location_info AS (
        SELECT 
            l.id as location_id,
            l.region_id,
            lt.terrain_id
        FROM location l
        LEFT JOIN location_terrain lt ON l.id = lt.location_id
        JOIN game_state gs ON l.id = gs.active_location_id
    ),
    shop_with_location AS (
        SELECT 
            s.*,
            CASE 
                WHEN s.scope = 'special' THEN (
                    SELECT l.name || ' in ' || r.name
                    FROM location l
                    JOIN region r ON l.region_id = r.id
                    WHERE l.id = s.location_id
                )
                WHEN s.scope = 'regional' AND s.region_id IS NOT NULL THEN (
                    SELECT r.name || ' region'
                    FROM region r
                    WHERE r.id = s.region_id
                )
                WHEN s.scope = 'regional' AND s.terrain_id IS NOT NULL THEN (
                    SELECT t.name || ' areas'
                    FROM terrain t
                    WHERE t.id = s.terrain_id
                )
            END as location_description,
            EXISTS (
                SELECT 1 FROM location_info li
                WHERE (s.scope = 'special' AND s.location_id = li.location_id)
                   OR (s.scope = 'regional' AND s.region_id = li.region_id)
                   OR (s.scope = 'regional' AND s.terrain_id = li.terrain_id)
            ) as is_accessible
        FROM shop s
        WHERE s.id = ?
    )
    SELECT *
    FROM shop_with_location`;

// Get available shops based on player's location
router.get('/available', (req: Request, res: Response) => {
    const db = getActiveDB();
    // First get the player's current location and its details
    const sql = `
        WITH location_info AS (
            SELECT 
                l.id as location_id,
                l.region_id,
                lt.terrain_id
            FROM location l
            LEFT JOIN location_terrain lt ON l.id = lt.location_id
            JOIN game_state gs ON l.id = gs.active_location_id
        )
        SELECT DISTINCT 
            s.*
        FROM shop s
        JOIN location_info li
        WHERE 
            -- Match special shops for this exact location
            (s.scope = 'special' AND s.location_id = li.location_id)
            OR
            -- Match regional shops for this region
            (s.scope = 'regional' AND s.region_id = li.region_id)
            OR
            -- Match regional shops for this terrain type
            (s.scope = 'regional' AND s.terrain_id = li.terrain_id)
    `;

    db.all(sql, [], (err: Error | null, rows: any[]) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        return res.json({
            message: 'success',
            data: rows
        });
    });
});

// Get specific shop details and its items
router.get('/:id', (req: Request, res: Response) => {
    const db = getActiveDB();
    const shopId = req.params.id;

    // First try to get shop details and its location info
    db.get(accessSql, [shopId], (err: Error | null, shop: any) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        if (!shop) {
            return res.status(404).json({ 
                error: 'Shop not found'
            });
        }

        if (!shop.is_accessible) {
            return res.status(403).json({ 
                error: `This shop is only available in ${shop.location_description}`
            });
        }

        // If shop is accessible, get its items
        const itemsSql = `
            SELECT 
                si.item_id,
                si.price,
                si.stock
            FROM shop_item si
            WHERE si.shop_id = ?
        `;

        db.all(itemsSql, [shopId], (err: Error | null, items: any[]) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }

            // Enrich items with details from allItems
            const enrichedItems = items.map(item => {
                const itemDetails = allItems.find(i => i.id === item.item_id);
                if (!itemDetails) return null;

                return {
                    id: item.item_id,
                    name: itemDetails.name,
                    description: itemDetails.description,
                    category: itemDetails.category,
                    basePrice: itemDetails.buyPrice,
                    price: item.price, // Price with markup
                    stock: item.stock, // null means infinite
                };
            }).filter(item => item !== null);

            // Return both shop details and its items
            return res.json({
                message: 'success',
                data: {
                    ...shop,
                    items: enrichedItems
                }
            });
        });
    });
});

// Purchase items from shop
router.post('/:id/buy', (req: Request, res: Response) => {
    const db = getActiveDB();
    const shopId = req.params.id;
    const items: { id: number; quantity: number }[] = req.body.items;
    
    // First verify shop is accessible and get items
    db.get(accessSql, [shopId], (err: Error | null, shop: any) => {
        if (err) return res.status(400).json({ error: err.message });
        if (!shop) return res.status(404).json({ error: 'Shop not found' });
        if (!shop.is_accessible) {
            return res.status(403).json({ 
                error: `This shop is only available in ${shop.location_description}`
            });
        }

        // Get shop items and calculate total cost
        const itemIds = items.map(item => item.id);
        const itemPlaceholders = itemIds.map(() => '?').join(',');
        const itemsSql = `
            SELECT si.item_id, si.price, si.stock
            FROM shop_item si
            WHERE si.shop_id = ? AND si.item_id IN (${itemPlaceholders})
        `;

        db.all(itemsSql, [shopId, ...itemIds], (err: Error | null, shopItems: any[]) => {
            if (err) return res.status(400).json({ error: err.message });

            // Calculate total cost and verify stock
            let totalCost = 0;
            const itemsToUpdate: { id: number; quantity: number; price: number }[] = [];

            for (const requestedItem of items) {
                const shopItem = shopItems.find(si => si.item_id === requestedItem.id);
                if (!shopItem) {
                    return res.status(400).json({ 
                        error: `Item ${requestedItem.id} not available in this shop` 
                    });
                }
                if (shopItem.stock !== null && shopItem.stock < requestedItem.quantity) {
                    return res.status(400).json({ 
                        error: `Not enough stock for item ${requestedItem.id}` 
                    });
                }
                totalCost += shopItem.price * requestedItem.quantity;
                itemsToUpdate.push({
                    id: requestedItem.id,
                    quantity: requestedItem.quantity,
                    price: shopItem.price
                });
            }

            // Begin transaction
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');

                // Check if trainer has enough money
                const checkBalanceSql = `
                    SELECT tf.balance
                    FROM trainer_finance tf
                    JOIN game_state gs ON tf.trainer_id = gs.active_trainer_id
                    WHERE tf.balance >= ?
                `;

                db.get(checkBalanceSql, [totalCost], (err: Error | null, row: any) => {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(400).json({ error: err.message });
                    }
                    if (!row) {
                        db.run('ROLLBACK');
                        return res.status(400).json({ error: 'Insufficient funds' });
                    }

                    // Update trainer's balance
                    const updateBalanceSql = `
                        UPDATE trainer_finance
                        SET balance = balance - ?
                        WHERE trainer_id = (SELECT active_trainer_id FROM game_state)
                    `;

                    db.run(updateBalanceSql, [totalCost], function(err: Error | null) {
                        if (err) {
                            db.run('ROLLBACK');
                            return res.status(400).json({ error: err.message });
                        }

                        // Add transaction record
                        const addTransactionSql = `
                            INSERT INTO financial_transaction (
                                trainer_id, amount, description, date, category
                            ) VALUES (
                                (SELECT active_trainer_id FROM game_state),
                                ?, ?, 
                                (SELECT current_date || ' ' || current_time FROM game_state), 
                                'item_purchase'
                            )
                        `;

                        const description = `Purchased items from ${shop.name}`;
                        db.run(addTransactionSql, [-totalCost, description], function(err: Error | null) {
                            if (err) {
                                db.run('ROLLBACK');
                                return res.status(400).json({ error: err.message });
                            }

                            // Update inventory for each item
                            let completed = 0;
                            itemsToUpdate.forEach(item => {
                                const updateInventorySql = `
                                    INSERT INTO inventory (trainer_id, item_id, quantity)
                                    VALUES (
                                        (SELECT active_trainer_id FROM game_state),
                                        ?, ?
                                    )
                                    ON CONFLICT(trainer_id, item_id) DO UPDATE SET
                                    quantity = quantity + ?
                                `;

                                db.run(updateInventorySql, 
                                    [item.id, item.quantity, item.quantity], 
                                    function(err: Error | null) {
                                        if (err) {
                                            db.run('ROLLBACK');
                                            return res.status(400).json({ error: err.message });
                                        }

                                        completed++;
                                        if (completed === itemsToUpdate.length) {
                                            db.run('COMMIT');
                                            res.json({
                                                message: 'success',
                                                data: { totalCost, items: itemsToUpdate }
                                            });
                                        }
                                    }
                                );
                            });
                        });
                    });
                });
            });
        });
    });
});

// Get all shops
router.get('/', (req: Request, res: Response) => {
    const db = getActiveDB();
    const sql = `
        SELECT 
            s.*,
            r.name as region_name,
            t.name as terrain_name,
            l.name as location_name
        FROM shop s
        LEFT JOIN region r ON s.region_id = r.id
        LEFT JOIN terrain t ON s.terrain_id = t.id
        LEFT JOIN location l ON s.location_id = l.id
        ORDER BY s.name
    `;
    
    db.all(sql, [], (err: Error | null, rows: any[]) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        return res.json({
            message: 'success',
            data: rows
        });
    });
});

// Update a shop
router.put('/:id', (req: Request, res: Response): void => {
    const db = getActiveDB();
    const shopId = req.params.id;
    const {
        name,
        scope,
        region_id,
        terrain_id,
        location_id,
        description,
        markup,
        items
    } = req.body;

    // Validate required fields
    if (!name || !scope) {
        res.status(400).json({ error: 'Name and scope are required' });
        return;
    }

    // Validate scope-specific requirements
    if (scope === 'regional' && (!region_id || !terrain_id)) {
        res.status(400).json({ error: 'Regional shops require both region_id and terrain_id' });
        return;
    }
    if (scope === 'special' && !location_id) {
        res.status(400).json({ error: 'Special shops require location_id' });
        return;
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Update shop data
        const updateShopSQL = `
            UPDATE shop
            SET name = ?,
                scope = ?,
                region_id = ?,
                terrain_id = ?,
                location_id = ?,
                description = ?,
                markup = ?
            WHERE id = ?
        `;

        db.run(updateShopSQL, [
            name,
            scope,
            scope === 'regional' ? region_id : null,
            scope === 'regional' ? terrain_id : null,
            scope === 'special' ? location_id : null,
            description,
            markup || 1.0,
            shopId
        ], function(err: Error | null) {
            if (err) {
                db.run('ROLLBACK');
                res.status(400).json({ error: err.message });
                return;
            }

            // Handle shop items
            if (items && Array.isArray(items)) {
                // First, delete existing items for this shop
                db.run('DELETE FROM shop_item WHERE shop_id = ?', [shopId], function(err: Error | null) {
                    if (err) {
                        db.run('ROLLBACK');
                        res.status(400).json({ error: err.message });
                        return;
                    }

                    // Insert new items
                    const insertItemSQL = 'INSERT INTO shop_item (shop_id, item_id, price, stock) VALUES (?, ?, ?, ?)';
                    
                    let completed = 0;
                    if (items.length === 0) {
                        // No items to insert, commit transaction
                        db.run('COMMIT', function(err: Error | null) {
                            if (err) {
                                db.run('ROLLBACK');
                                res.status(400).json({ error: err.message });
                                return;
                            }
                            res.json({
                                message: 'Shop updated successfully',
                                data: { id: shopId }
                            });
                        });
                    } else {
                        for (const item of items) {
                            db.run(insertItemSQL, [
                                shopId,
                                item.item_id,
                                item.price,
                                item.stock || null
                            ], function(err: Error | null) {
                                if (err) {
                                    db.run('ROLLBACK');
                                    res.status(400).json({ error: err.message });
                                    return;
                                }

                                completed++;
                                if (completed === items.length) {
                                    // Commit transaction
                                    db.run('COMMIT', function(err: Error | null) {
                                        if (err) {
                                            db.run('ROLLBACK');
                                            res.status(400).json({ error: err.message });
                                            return;
                                        }
                                        res.json({
                                            message: 'Shop updated successfully',
                                            data: { id: shopId }
                                        });
                                    });
                                }
                            });
                        }
                    }
                });
            } else {
                // No items to update, just commit
                db.run('COMMIT', function(err: Error | null) {
                    if (err) {
                        db.run('ROLLBACK');
                        res.status(400).json({ error: err.message });
                        return;
                    }
                    res.json({
                        message: 'Shop updated successfully',
                        data: { id: shopId }
                    });
                });
            }
        });
    });
});

// Get shop details for editing (bypasses accessibility check)
router.get('/:id/edit', (req: Request, res: Response): void => {
    const db = getActiveDB();
    const shopId = req.params.id;

    const shopDetailsSql = `
        SELECT 
            s.*,
            r.name as region_name,
            t.name as terrain_name,
            l.name as location_name
        FROM shop s
        LEFT JOIN region r ON s.region_id = r.id
        LEFT JOIN terrain t ON s.terrain_id = t.id
        LEFT JOIN location l ON s.location_id = l.id
        WHERE s.id = ?
    `;

    db.get(shopDetailsSql, [shopId], (err: Error | null, shop: any) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }

        if (!shop) {
            res.status(404).json({ error: 'Shop not found' });
            return;
        }

        // Get shop items
        const itemsSql = `
            SELECT 
                si.item_id,
                si.price,
                si.stock
            FROM shop_item si
            WHERE si.shop_id = ?
        `;

        db.all(itemsSql, [shopId], (err: Error | null, items: any[]) => {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }

            // Enrich items with details from allItems
            const enrichedItems = items.map(item => {
                const itemDetails = allItems.find(i => i.id === item.item_id);
                if (!itemDetails) return null;

                return {
                    id: item.item_id,
                    name: itemDetails.name,
                    description: itemDetails.description,
                    category: itemDetails.category,
                    basePrice: itemDetails.buyPrice,
                    price: item.price,
                    stock: item.stock,
                };
            }).filter(item => item !== null);

            res.json({
                message: 'success',
                data: {
                    ...shop,
                    items: enrichedItems
                }
            });
        });
    });
});

// Create a new shop
router.post('/', (req: Request, res: Response): void => {
    const db = getActiveDB();
    const {
        name,
        scope,
        region_id,
        terrain_id,
        location_id,
        description,
        markup,
        items
    } = req.body;

    // Validate required fields
    if (!name || !scope) {
        res.status(400).json({ error: 'Name and scope are required' });
        return;
    }

    // Validate scope-specific requirements
    if (scope === 'regional' && (!region_id || !terrain_id)) {
        res.status(400).json({ error: 'Regional shops require both region_id and terrain_id' });
        return;
    }
    if (scope === 'special' && !location_id) {
        res.status(400).json({ error: 'Special shops require location_id' });
        return;
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Insert shop data
        const insertShopSQL = `
            INSERT INTO shop (
                name,
                scope,
                region_id,
                terrain_id,
                location_id,
                description,
                markup
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(insertShopSQL, [
            name,
            scope,
            scope === 'regional' ? region_id : null,
            scope === 'regional' ? terrain_id : null,
            scope === 'special' ? location_id : null,
            description,
            markup || 1.0
        ], function(err: Error | null) {
            if (err) {
                db.run('ROLLBACK');
                res.status(400).json({ error: err.message });
                return;
            }

            const shopId = this.lastID;

            // Handle shop items
            if (items && Array.isArray(items) && items.length > 0) {
                const insertItemSQL = 'INSERT INTO shop_item (shop_id, item_id, price, stock) VALUES (?, ?, ?, ?)';
                
                let completed = 0;
                for (const item of items) {
                    db.run(insertItemSQL, [
                        shopId,
                        item.item_id,
                        item.price,
                        item.stock || null
                    ], function(err: Error | null) {
                        if (err) {
                            db.run('ROLLBACK');
                            res.status(400).json({ error: err.message });
                            return;
                        }

                        completed++;
                        if (completed === items.length) {
                            // Commit transaction
                            db.run('COMMIT', function(err: Error | null) {
                                if (err) {
                                    db.run('ROLLBACK');
                                    res.status(400).json({ error: err.message });
                                    return;
                                }
                                res.json({
                                    message: 'Shop created successfully',
                                    data: { id: shopId }
                                });
                            });
                        }
                    });
                }
            } else {
                // No items to insert, just commit
                db.run('COMMIT', function(err: Error | null) {
                    if (err) {
                        db.run('ROLLBACK');
                        res.status(400).json({ error: err.message });
                        return;
                    }
                    res.json({
                        message: 'Shop created successfully',
                        data: { id: shopId }
                    });
                });
            }
        });
    });
});

export default router;