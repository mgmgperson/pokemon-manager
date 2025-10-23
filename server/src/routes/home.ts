import { Router, Request, Response } from 'express';
import { getActiveDB } from '../services/dbManager';

const router: Router = Router();

// GET /trainers-around/:locationId - Get trainers in the same location (placeholder)
router.get('/trainers-around/:locationId', (req: Request, res: Response) => {
  try {
    const db = getActiveDB();
    const locationId = req.params.locationId;

    // This is a placeholder - you can implement actual logic later
    // For now, return some mock trainers
    const mockTrainers = [
      {
        id: 1,
        fname: "Red",
        lname: "",
        title: "Champion of Kanto",
        pwtr_rating: 2800,
        region_name: "Kanto"
      },
      {
        id: 2, 
        fname: "Blue",
        lname: "",
        title: "Gym Leader of Viridian City",
        pwtr_rating: 2650,
        region_name: "Kanto"
      }
    ];

    res.json({
      message: 'success',
      data: mockTrainers
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /next-events/:trainerId - Get upcoming events for trainer (placeholder)
router.get('/next-events/:trainerId', (req: Request, res: Response) => {
  try {
    const trainerId = req.params.trainerId;

    // This is a placeholder - you can implement actual logic later
    const mockEvents = [
      {
        id: 1,
        title: "Kanto Conference",
        date: "2025-09-15",
        type: "tournament",
        description: "Annual regional tournament"
      },
      {
        id: 2,
        title: "Elite Four Challenge",
        date: "2025-08-30", 
        type: "battle",
        description: "Challenge the Elite Four"
      }
    ];

    res.json({
      message: 'success',
      data: mockEvents
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
