import { type Request, type Response } from 'express';

const MOCK_TRAINERS = [
  {
    id: 1,
    fname: 'Red',
    lname: '',
    title: 'Champion of Kanto',
    pwtr_rating: 2800,
    region_name: 'Kanto',
  },
  {
    id: 2,
    fname: 'Blue',
    lname: '',
    title: 'Gym Leader of Viridian City',
    pwtr_rating: 2650,
    region_name: 'Kanto',
  },
];

const MOCK_EVENTS = [
  {
    id: 1,
    title: 'Kanto Conference',
    date: '2025-09-15',
    type: 'tournament',
    description: 'Annual regional tournament',
  },
  {
    id: 2,
    title: 'Elite Four Challenge',
    date: '2025-08-30',
    type: 'battle',
    description: 'Challenge the Elite Four',
  },
];

// TODO: Replace these placeholders with save-backed nearby-trainer and upcoming-event queries before mounting this router.
export function getTrainersAround(_request: Request, response: Response): void {
  response.json({ message: 'success', data: MOCK_TRAINERS });
}

export function getNextEvents(_request: Request, response: Response): void {
  response.json({ message: 'success', data: MOCK_EVENTS });
}
