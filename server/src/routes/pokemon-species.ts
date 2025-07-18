import { Router } from 'express';
import { allSpecies, initSpecies } from '../data/pokemon-species';

const router: Router = Router();

// Initialize Species data once
let initialized = false;
if (!initialized) {
    initSpecies();
    initialized = true;
}

// GET / - Get all pokemon species with optional limit
router.get('/', (req: any, res: any) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
        
        if (limit && (isNaN(limit) || limit <= 0)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid limit parameter'
            });
        }

        let speciesList = allSpecies.map(species => ({
            id: species.id,
            name: species.name,
            generation: species.generation,
            is_legendary: species.isLegendary,
            is_mythical: species.isMythical
        }));

        // Apply limit if specified
        if (limit) {
            speciesList = speciesList.slice(0, limit);
        }

        res.json({
            success: true,
            data: speciesList
        });
    } catch (error) {
        console.error('Error fetching Pokemon species:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// GET /:id - Get pokemon species by ID
router.get('/:id', (req: any, res: any) => {
    try {
        const speciesId = parseInt(req.params.id);
        
        if (isNaN(speciesId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid species ID'
            });
        }

        const species = allSpecies.find(s => s.id === speciesId);
        
        if (!species) {
            return res.status(404).json({
                success: false,
                message: 'Pokemon species not found'
            });
        }

        const speciesData = {
            id: species.id,
            name: species.name,
            generation: species.generation,
            is_legendary: species.isLegendary,
            is_mythical: species.isMythical,
            base_happiness: species.baseHappiness,
            capture_rate: species.captureRate,
            genera: species.genera
        };

        res.json({
            success: true,
            data: speciesData
        });
    } catch (error) {
        console.error('Error fetching Pokemon species:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

export default router;
