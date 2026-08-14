import type { SelectedPokemon } from './team-picker';

export interface BattleResult {
  log: string[];
  winner: string;
  trainer1Team: string[];
  trainer2Team: string[];
}

export interface SinglesBattleInput {
  trainer1Name: string;
  trainer2Name: string;
  trainer1Team: SelectedPokemon[];
  trainer2Team: SelectedPokemon[];
}

interface ActivePokemon {
  nickname: string;
  hp: number;
  fieldAdv: number;
  fainted: boolean;
}

function weightedRandom<T>(items: T[], weight: (item: T) => number): T {
  const totalWeight = items.map(weight).reduce((total, itemWeight) => total + itemWeight, 0);
  const target = Math.random() * totalWeight;
  let accumulatedWeight = 0;

  for (const item of items) {
    accumulatedWeight += weight(item);
    if (target < accumulatedWeight) {
      return item;
    }
  }

  return items[items.length - 1];
}

function computeSwitchProbability(hp: number, maxHp: number, fieldAdv: number, averageAdv: number): number {
  const hpFactor = 1 - (hp / maxHp);
  const advantageFactor = averageAdv > 0 ? Math.max(0, (averageAdv - fieldAdv) / averageAdv) : 0;
  return Math.min(1, 0.25 * hpFactor + 0.25 * advantageFactor);
}

function findNextHealthyIndexWeighted(roster: ActivePokemon[], currentIndex: number): number | null {
  const candidates = roster
    .map((pokemon, index) => ({ pokemon, index }))
    .filter((candidate) => !candidate.pokemon.fainted && candidate.index !== currentIndex);
  if (candidates.length === 0) {
    return null;
  }

  const averageAdvantage = candidates.reduce(
    (total, candidate) => total + candidate.pokemon.fieldAdv,
    0
  ) / candidates.length;
  return weightedRandom(candidates, (candidate) => {
    const hpFactor = 1 - (candidate.pokemon.hp / 100);
    const advantageFactor = averageAdvantage > 0
      ? Math.max(0, (averageAdvantage - candidate.pokemon.fieldAdv) / averageAdvantage)
      : 0;
    return hpFactor * 0.5 + advantageFactor * 0.5;
  }).index;
}

function selectInitialIndex(roster: ActivePokemon[]): number {
  return weightedRandom(
    roster.map((pokemon, index) => ({ pokemon, index })),
    (candidate) => 1 / (candidate.pokemon.fieldAdv + 1)
  ).index;
}

function displayTeam(team: SelectedPokemon[]): string[] {
  return team.map((item) => `${item.poke.nickname}${item.suffix}`);
}

function battleResult(
  log: string[],
  winner: string,
  trainer1Team: SelectedPokemon[],
  trainer2Team: SelectedPokemon[]
): BattleResult {
  return {
    log,
    winner,
    trainer1Team: displayTeam(trainer1Team),
    trainer2Team: displayTeam(trainer2Team),
  };
}

export function simulateSingles6v6Battle(input: SinglesBattleInput): BattleResult {
  const { trainer1Name, trainer2Name, trainer1Team, trainer2Team } = input;
  const battleLog: string[] = [
    `** ${trainer1Name} selected: ${displayTeam(trainer1Team).join(', ')} **`,
    `** ${trainer2Name} selected: ${displayTeam(trainer2Team).join(', ')} **`,
  ];
  const trainer1Roster: ActivePokemon[] = trainer1Team.map((item) => ({
    nickname: `${item.poke.nickname}${item.suffix}`,
    hp: item.poke.current_hp ?? 50,
    fieldAdv: item.adv,
    fainted: false,
  }));
  const trainer2Roster: ActivePokemon[] = trainer2Team.map((item) => ({
    nickname: `${item.poke.nickname}${item.suffix}`,
    hp: item.poke.current_hp ?? 50,
    fieldAdv: item.adv,
    fainted: false,
  }));

  let trainer1Index = selectInitialIndex(trainer1Roster);
  let trainer2Index = selectInitialIndex(trainer2Roster);
  let trainer1Switches = 0;
  let trainer2Switches = 0;
  battleLog.push(`${trainer1Name} sends out ${trainer1Roster[trainer1Index].nickname}!`);
  battleLog.push(`${trainer2Name} sends out ${trainer2Roster[trainer2Index].nickname}!`);

  for (let turn = 0; turn < 200; turn += 1) {
    const trainer1OutOfPokemon = trainer1Roster.every((pokemon) => pokemon.fainted);
    const trainer2OutOfPokemon = trainer2Roster.every((pokemon) => pokemon.fainted);
    if (trainer1OutOfPokemon && trainer2OutOfPokemon) {
      battleLog.push("Both trainers have no more usable Pokémon. It's a draw!");
      return battleResult(battleLog, 'Draw', trainer1Team, trainer2Team);
    }
    if (trainer1OutOfPokemon) {
      battleLog.push(`${trainer1Name} is out of usable Pokémon! ${trainer2Name} wins!`);
      return battleResult(battleLog, trainer2Name, trainer1Team, trainer2Team);
    }
    if (trainer2OutOfPokemon) {
      battleLog.push(`${trainer2Name} is out of usable Pokémon! ${trainer1Name} wins!`);
      return battleResult(battleLog, trainer1Name, trainer1Team, trainer2Team);
    }

    const currentTrainer1Pokemon = trainer1Roster[trainer1Index];
    const currentTrainer2Pokemon = trainer2Roster[trainer2Index];
    const averageTrainer1Advantage = trainer1Roster.reduce(
      (total, pokemon) => total + pokemon.fieldAdv,
      0
    ) / trainer1Roster.length;
    const averageTrainer2Advantage = trainer2Roster.reduce(
      (total, pokemon) => total + pokemon.fieldAdv,
      0
    ) / trainer2Roster.length;

    if (
      Math.random() < computeSwitchProbability(
        currentTrainer1Pokemon.hp,
        100,
        currentTrainer1Pokemon.fieldAdv,
        averageTrainer1Advantage
      ) && trainer1Switches < 7
    ) {
      const nextIndex = findNextHealthyIndexWeighted(trainer1Roster, trainer1Index);
      if (nextIndex !== null) {
        trainer1Index = nextIndex;
        trainer1Switches += 1;
        battleLog.push(
          `${trainer1Name} switches to ${trainer1Roster[trainer1Index].nickname} (switch #${trainer1Switches})`
        );
      }
    }
    if (
      Math.random() < computeSwitchProbability(
        currentTrainer2Pokemon.hp,
        100,
        currentTrainer2Pokemon.fieldAdv,
        averageTrainer2Advantage
      ) && trainer2Switches < 7
    ) {
      const nextIndex = findNextHealthyIndexWeighted(trainer2Roster, trainer2Index);
      if (nextIndex !== null) {
        trainer2Index = nextIndex;
        trainer2Switches += 1;
        battleLog.push(
          `${trainer2Name} switches to ${trainer2Roster[trainer2Index].nickname} (switch #${trainer2Switches})`
        );
      }
    }

    if (trainer1Roster[trainer1Index].fainted) {
      const nextIndex = findNextHealthyIndexWeighted(trainer1Roster, trainer1Index);
      if (nextIndex === null) {
        battleLog.push(`${trainer1Name} has no more Pokémon to send! ${trainer2Name} wins!`);
        return battleResult(battleLog, trainer2Name, trainer1Team, trainer2Team);
      }
      trainer1Index = nextIndex;
      battleLog.push(`${trainer1Name} sends in ${trainer1Roster[trainer1Index].nickname}!`);
    }
    if (trainer2Roster[trainer2Index].fainted) {
      const nextIndex = findNextHealthyIndexWeighted(trainer2Roster, trainer2Index);
      if (nextIndex === null) {
        battleLog.push(`${trainer2Name} has no more Pokémon to send! ${trainer1Name} wins!`);
        return battleResult(battleLog, trainer1Name, trainer1Team, trainer2Team);
      }
      trainer2Index = nextIndex;
      battleLog.push(`${trainer2Name} sends in ${trainer2Roster[trainer2Index].nickname}!`);
    }

    const attacker1 = trainer1Roster[trainer1Index];
    const attacker2 = trainer2Roster[trainer2Index];
    attacker2.hp -= Math.max(0, Math.floor(Math.random() * attacker1.fieldAdv / 10));
    attacker1.hp -= Math.max(0, Math.floor(Math.random() * attacker2.fieldAdv / 10));

    if (attacker1.hp <= 0 && attacker2.hp <= 0) {
      if (attacker1.hp === attacker2.hp) {
        battleLog.push(
          `Both ${trainer1Name}'s ${attacker1.nickname} and ${trainer2Name}'s ${attacker2.nickname} fainted simultaneously!`
        );
        attacker1.fainted = true;
        attacker2.fainted = true;
      } else if (attacker1.hp > attacker2.hp) {
        attacker1.hp = 1;
        attacker2.fainted = true;
        battleLog.push(`${trainer2Name}'s ${attacker2.nickname} fainted!`);
      } else {
        attacker2.hp = 1;
        attacker1.fainted = true;
        battleLog.push(`${trainer1Name}'s ${attacker1.nickname} fainted!`);
      }
    } else {
      if (attacker1.hp <= 0) {
        attacker1.fainted = true;
        battleLog.push(`${trainer1Name}'s ${attacker1.nickname} fainted!`);
      }
      if (attacker2.hp <= 0) {
        attacker2.fainted = true;
        battleLog.push(`${trainer2Name}'s ${attacker2.nickname} fainted!`);
      }
    }
  }

  battleLog.push('Reached 200 turns, calling it a draw!');
  return battleResult(battleLog, 'Draw', trainer1Team, trainer2Team);
}
