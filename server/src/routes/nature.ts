import { Router } from 'express';
import { allNatures, initNatures } from '../data/nature';
import { Stat } from '../data/enums/stat';

const router: Router = Router();

// Initialize Nature data once
let initialized = false;
if (!initialized) {
    initNatures();
    initialized = true;
}

// Helper function to convert Stat enum to string
function statEnumToString(statEnum: Stat): string {
    switch (statEnum) {
        case Stat.HP: return 'hp';
        case Stat.ATK: return 'attack';
        case Stat.DEF: return 'defense';
        case Stat.SPATK: return 'special-attack';
        case Stat.SPDEF: return 'special-defense';
        case Stat.SPE: return 'speed';
        case Stat.ACC: return 'accuracy';
        case Stat.EVA: return 'evasion';
        default: return 'unknown';
    }
}

// GET / - Get all natures with optional limit
router.get('/', (req: any, res: any) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
        
        if (limit && (isNaN(limit) || limit <= 0)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid limit parameter'
            });
        }

        let natureList = allNatures.map(nature => ({
            id: nature.id,
            name: nature.name,
            increased_stat: statEnumToString(nature.increasedStat),
            decreased_stat: statEnumToString(nature.decreasedStat)
        }));

        // Apply limit if specified
        if (limit) {
            natureList = natureList.slice(0, limit);
        }

        res.json({
            success: true,
            data: natureList
        });
    } catch (error) {
        console.error('Error fetching natures:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// GET /:id - Get nature by ID
router.get('/:id', (req: any, res: any) => {
    try {
        const natureId = parseInt(req.params.id);
        
        if (isNaN(natureId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid nature ID'
            });
        }

        const nature = allNatures.find(n => n.id === natureId);
        
        if (!nature) {
            return res.status(404).json({
                success: false,
                message: 'Nature not found'
            });
        }

        const natureData = {
            id: nature.id,
            name: nature.name,
            increased_stat: statEnumToString(nature.increasedStat),
            decreased_stat: statEnumToString(nature.decreasedStat)
        };

        res.json({
            success: true,
            data: natureData
        });
    } catch (error) {
        console.error('Error fetching nature:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

export default router;
