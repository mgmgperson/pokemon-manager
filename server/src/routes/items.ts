import { Router, Request, Response } from 'express';
import sqlite3 from 'sqlite3';
import { allItems } from '../data/item';
import { getActiveDB } from '../services/dbManager';

const router: Router = Router();

// Get inventory for active trainer
router.get('/inventory', (req: Request, res: Response) => {
    const db = getActiveDB();
    const sql = `
        SELECT i.item_id, i.quantity 
        FROM inventory i
        JOIN game_state gs ON i.trainer_id = gs.active_trainer_id
        WHERE i.quantity > 0
    `;
    
    db.all(sql, [], (err: Error | null, rows: any[]) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        // Enrich inventory data with item details
        const enrichedInventory = rows.map(row => {
            const itemDetails = allItems.find(item => item.id === row.item_id);
            if (!itemDetails) return null;

            return {
                id: row.item_id,
                name: itemDetails.name,
                category: itemDetails.category,
                buyPrice: itemDetails.buyPrice,
                sellPrice: itemDetails.sellPrice,
                description: itemDetails.description,
                quantity: row.quantity
            };
        }).filter(item => item !== null);

        // Group by category
        const groupedInventory = enrichedInventory.reduce((acc: any, item: any) => {
            if (!acc[item.category]) {
                acc[item.category] = [];
            }
            acc[item.category].push(item);
            return acc;
        }, {});

        return res.json({
            message: 'success',
            data: groupedInventory
        });
    });
});

// Sell items from inventory
router.post('/sell', (req: Request, res: Response) => {
    const db = getActiveDB();
    const items: { id: number; quantity: number }[] = req.body.items;
    
    // Begin transaction
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // First verify items are in inventory with sufficient quantity
        const itemIds = items.map(item => item.id);
        const itemPlaceholders = itemIds.map(() => '?').join(',');
        
        const checkInventorySql = `
            SELECT i.item_id, i.quantity
            FROM inventory i
            JOIN game_state gs ON i.trainer_id = gs.active_trainer_id
            WHERE i.item_id IN (${itemPlaceholders})
        `;

        db.all(checkInventorySql, itemIds, (err: Error | null, inventory: any[]) => {
            if (err) {
                db.run('ROLLBACK');
                return res.status(400).json({ error: err.message });
            }

            // Verify quantities and calculate total value
            let totalValue = 0;
            const itemsToUpdate: { id: number; quantity: number; value: number }[] = [];

            for (const requestedItem of items) {
                const inventoryItem = inventory.find(i => i.item_id === requestedItem.id);
                if (!inventoryItem || inventoryItem.quantity < requestedItem.quantity) {
                    db.run('ROLLBACK');
                    return res.status(400).json({ 
                        error: `Insufficient quantity for item ${requestedItem.id}` 
                    });
                }

                const itemDetails = allItems.find(i => i.id === requestedItem.id);
                if (!itemDetails || !itemDetails.sellPrice) {
                    db.run('ROLLBACK');
                    return res.status(400).json({ 
                        error: `Item ${requestedItem.id} cannot be sold` 
                    });
                }

                totalValue += itemDetails.sellPrice * requestedItem.quantity;
                itemsToUpdate.push({
                    id: requestedItem.id,
                    quantity: requestedItem.quantity,
                    value: itemDetails.sellPrice * requestedItem.quantity
                });
            }

            // Update trainer's balance
            const updateBalanceSql = `
                UPDATE trainer_finance
                SET balance = balance + ?
                WHERE trainer_id = (SELECT active_trainer_id FROM game_state)
            `;

            db.run(updateBalanceSql, [totalValue], function(err: Error | null) {
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
                        'sale'
                    )
                `;

                const description = `Sold ${items.reduce((sum, i) => sum + i.quantity, 0)} items`;
                db.run(addTransactionSql, [totalValue, description], function(err: Error | null) {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(400).json({ error: err.message });
                    }

                    // Update inventory for each item
                    let completed = 0;
                    itemsToUpdate.forEach(item => {
                        const updateInventorySql = `
                            UPDATE inventory
                            SET quantity = quantity - ?
                            WHERE trainer_id = (SELECT active_trainer_id FROM game_state)
                            AND item_id = ?
                        `;

                        db.run(updateInventorySql, [item.quantity, item.id], function(err: Error | null) {
                            if (err) {
                                db.run('ROLLBACK');
                                return res.status(400).json({ error: err.message });
                            }

                            completed++;
                            if (completed === itemsToUpdate.length) {
                                // Delete any inventory entries with quantity 0
                                const cleanupSql = `
                                    DELETE FROM inventory
                                    WHERE quantity <= 0 AND
                                    trainer_id = (SELECT active_trainer_id FROM game_state)
                                `;
                                
                                db.run(cleanupSql, [], function(err: Error | null) {
                                    if (err) {
                                        db.run('ROLLBACK');
                                        return res.status(400).json({ error: err.message });
                                    }

                                    db.run('COMMIT');
                                    res.json({
                                        message: 'success',
                                        data: { totalValue, items: itemsToUpdate }
                                    });
                                });
                            }
                        });
                    });
                });
            });
        });
    });
});

// Get all available items
router.get('/all', (req: Request, res: Response): void => {
    // Return all items from the imported data
    const items = allItems.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        buyPrice: item.buyPrice,
        sellPrice: item.sellPrice
    }));

    res.json({
        message: 'success',
        data: items
    });
});

export default router;