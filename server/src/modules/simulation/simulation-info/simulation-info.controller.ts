import { type Request, type Response } from 'express';

export function getSimulationData(_request: Request, response: Response): void {
  response.json({ message: 'This will be simulation data' });
}
