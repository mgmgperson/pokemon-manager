import { Router, Request, Response } from 'express';

const router: Router = Router();

// Placeholder for interaction with the C++ simulation engine
router.get('/simulation-data', (req: Request, res: Response) => {
  // Fetch data from the simulation engine
  res.json({ message: 'This will be simulation data' });
});

export default router;
