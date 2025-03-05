import { Router, Request, Response } from 'express';
import { pickBest6PokemonForField } from '../battling/TeamPicker';
import { simulateSingles6v6Battle } from '../battling/BattleSimulator';

const router: Router = Router();

router.get('/singles6v6', async (req: Request, res: Response) => {
    const { field, trainer1, trainer2 } = req.query;

    if (!field || !trainer1 || !trainer2) {
      res.status(400).json({ 
        error: 'Missing query parameters. Usage: ?field=windy&trainer1=1&trainer2=2' 
      });
      return;
    }

    const fieldName = String(field);
    const t1Id = parseInt(String(trainer1), 10);
    const t2Id = parseInt(String(trainer2), 10);

    if (isNaN(t1Id) || isNaN(t2Id)) {
      res.status(400).json({ 
        error: 'Invalid trainer IDs (must be numbers).' 
      });
      return;
    }

    const team1 = await pickBest6PokemonForField(t1Id, fieldName);
    const team2 = await pickBest6PokemonForField(t2Id, fieldName);

    const battleResult = await simulateSingles6v6Battle(fieldName, t1Id, t2Id, team1, team2);

    res.json({
      message: 'Battle simulation complete',
      data: battleResult
    });
    return;
});

export default router;