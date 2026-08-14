import type {
  SimAdvanceRequest,
  SimReport,
  SimTimeStep,
} from '../../types/sim';

export interface SimulationPlan {
  fromTime: string;
  toTime: string;
  usedFallbackStep: boolean;
}

export function createSimulationReport(): SimReport {
  return {
    fromTime: '',
    toTime: '',
    resolvedEventInstanceIds: [],
    simmedMatchIds: [],
    awardedBadges: [],
    notes: [],
  };
}

export function combineDateTime(date: string, time: string): string {
  return `${date}T${time || '00:00:00'}`;
}

export function splitDateTime(datetime: string): { date: string; time: string } {
  const [date, time] = datetime.split('T');
  return {
    date: date || datetime,
    time: time || '00:00:00',
  };
}

export function addTimeStep(datetime: string, step: SimTimeStep, amount: number): string {
  const date = new Date(datetime);

  if (step === 'hour') {
    date.setHours(date.getHours() + amount);
  } else if (step === 'day') {
    date.setDate(date.getDate() + amount);
  } else {
    date.setDate(date.getDate() + (amount * 7));
  }

  return date.toISOString().replace('.000Z', '').replace('Z', '');
}

export function planSimulationAdvance(
  fromTime: string,
  request: SimAdvanceRequest,
  nextEventTime: string | null
): SimulationPlan {
  const mode = request.mode ?? 'byTime';
  const step = request.step ?? 'day';
  const amount = request.amount ?? 1;

  if (mode === 'byTime') {
    return {
      fromTime,
      toTime: addTimeStep(fromTime, step, amount),
      usedFallbackStep: false,
    };
  }

  if (!nextEventTime || nextEventTime <= fromTime) {
    return {
      fromTime,
      toTime: addTimeStep(fromTime, step, 1),
      usedFallbackStep: true,
    };
  }

  return { fromTime, toTime: nextEventTime, usedFallbackStep: false };
}

export function nextSimulationCursor(cursorTime: string): string {
  return addTimeStep(cursorTime, 'hour', 1);
}
