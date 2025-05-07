// src/battling/BattleSimulator.ts

import { PokemonRow, TrainerRow } from "../types/database";
import { pickBest6PokemonForField } from "./TeamPicker";
import { fetchTrainer } from "../services/dbService";

export interface BattleResult {
  log: string[];
  winner: string;
  trainer1Team: string[];
  trainer2Team: string[];
}

/**
 * Weighted random selection helper.
 * Given an array of objects and a weight function, returns one object.
 */
function weightedRandom<T>(items: T[], weightFn: (item: T) => number): T {
  const weights = items.map(weightFn);
  const total = weights.reduce((acc, w) => acc + w, 0);
  const rand = Math.random() * total;
  let sum = 0;
  for (let i = 0; i < items.length; i++) {
    sum += weights[i];
    if (rand < sum) {
      return items[i];
    }
  }
  return items[items.length - 1];
}

/**
 * Compute a switching probability for a Pokémon.
 * Lower HP and lower field advantage yield a higher chance.
 * Adjust constants as needed.
 */
function computeSwitchProbability(hp: number, maxHP: number, fieldAdv: number, avgAdv: number): number {
  // Normalize HP factor: if hp is very low, factor approaches 1.
  const hpFactor = 1 - (hp / maxHP); // 0 when at full HP, 1 when at 0
  // Field advantage factor: if fieldAdv is below average, factor approaches 1.
  const advFactor = avgAdv > 0 ? Math.max(0, (avgAdv - fieldAdv) / avgAdv) : 0;
  // Combine factors (weights can be tuned)
  return Math.min(1, 0.25 * hpFactor + 0.25 * advFactor);
}

/**
 * Returns the weighted random index from a roster.
 * Lower HP and lower field advantage make an entry more likely to be chosen.
 */
function findNextHealthyIndexWeighted(roster: ActiveMon[], currentIdx: number): number | null {
  const candidates = roster
    .map((mon, idx) => ({ mon, idx }))
    .filter(item => !item.mon.fainted && item.idx !== currentIdx);
  if (candidates.length === 0) return null;
  
  // For simplicity, assume max HP is 100 for weighting.
  const maxHP = 100;
  // Calculate average fieldAdv among candidates.
  const avgAdv = candidates.reduce((sum, item) => sum + item.mon.fieldAdv, 0) / candidates.length;
  
  const selected = weightedRandom(candidates, item => {
    const hpFactor = 1 - (item.mon.hp / maxHP);
    const advFactor = avgAdv > 0 ? Math.max(0, (avgAdv - item.mon.fieldAdv) / avgAdv) : 0;
    // Combine factors (adjust weights as needed)
    return hpFactor * 0.5 + advFactor * 0.5;
  });
  return selected.idx;
}

/**
 * Selects an initial active index from the team using weighted random selection.
 * Lower fieldAdv means a higher chance of being sent out first.
 */
function selectInitialIndex(roster: ActiveMon[]): number {
  const selected = weightedRandom(roster.map((mon, idx) => ({ mon, idx })), item => {
    // Invert advantage: lower advantage gets higher weight.
    return 1 / (item.mon.fieldAdv + 1);
  });
  return selected.idx;
}

// Define the type for an active Pokémon in battle.
interface ActiveMon {
  nickname: string;
  hp: number;
  fieldAdv: number;
  fainted: boolean;
}

export async function simulateSingles6v6Battle(
  field: string,
  trainer1Id: number,
  trainer2Id: number,
  team1Data: Array<{ poke: PokemonRow; adv: number; suffix: string }>,
  team2Data: Array<{ poke: PokemonRow; adv: number; suffix: string }>
): Promise<BattleResult> {

  const battleLog: string[] = [];
  // Fetch trainer names
  const t1 = await fetchTrainer(trainer1Id);
  const t2 = await fetchTrainer(trainer2Id);
  const t1Name = t1 ? `${t1.fname} ${t1.lname}` : `Trainer ${trainer1Id}`;
  const t2Name = t2 ? `${t2.fname} ${t2.lname}` : `Trainer ${trainer2Id}`;

  battleLog.push(`** ${t1Name} selected: ${team1Data.map(p => p.poke.nickname + p.suffix).join(', ')} **`);
  battleLog.push(`** ${t2Name} selected: ${team2Data.map(p => p.poke.nickname + p.suffix).join(', ')} **`);

  // Build active rosters
  const t1ActiveRoster: ActiveMon[] = team1Data.map(item => ({
    nickname: item.poke.nickname + item.suffix,
    hp: item.poke.current_hp ?? 50,
    fieldAdv: item.adv,
    fainted: false,
  }));
  const t2ActiveRoster: ActiveMon[] = team2Data.map(item => ({
    nickname: item.poke.nickname + item.suffix,
    hp: item.poke.current_hp ?? 50,
    fieldAdv: item.adv,
    fainted: false,
  }));

  // Select initial active Pokémon using weighted random selection
  let t1Index = selectInitialIndex(t1ActiveRoster);
  let t2Index = selectInitialIndex(t2ActiveRoster);

  let t1Switches = 0;
  let t2Switches = 0;
  
  battleLog.push(`${t1Name} sends out ${t1ActiveRoster[t1Index].nickname}!`);
  battleLog.push(`${t2Name} sends out ${t2ActiveRoster[t2Index].nickname}!`);

  const MAX_TURNS = 200;
  let turn = 0;

  function allFainted(roster: ActiveMon[]): boolean {
    return roster.every(mon => mon.fainted);
  }

  while (turn < MAX_TURNS) {
    turn++;

    // Check if both teams are out simultaneously: draw.
    if (allFainted(t1ActiveRoster) && allFainted(t2ActiveRoster)) {
      battleLog.push(`Both trainers have no more usable Pokémon. It's a draw!`);
      return {
        log: battleLog,
        winner: "Draw",
        trainer1Team: team1Data.map(item => item.poke.nickname + item.suffix),
        trainer2Team: team2Data.map(item => item.poke.nickname + item.suffix),
      };
    }
    
    // Check each team: if one team is completely fainted, declare winner.
    if (allFainted(t1ActiveRoster)) {
      battleLog.push(`${t1Name} is out of usable Pokémon! ${t2Name} wins!`);
      return {
        log: battleLog,
        winner: t2Name,
        trainer1Team: team1Data.map(item => item.poke.nickname + item.suffix),
        trainer2Team: team2Data.map(item => item.poke.nickname + item.suffix),
      };
    }
    if (allFainted(t2ActiveRoster)) {
      battleLog.push(`${t2Name} is out of usable Pokémon! ${t1Name} wins!`);
      return {
        log: battleLog,
        winner: t1Name,
        trainer1Team: team1Data.map(item => item.poke.nickname + item.suffix),
        trainer2Team: team2Data.map(item => item.poke.nickname + item.suffix),
      };
    }

    // Switching logic: before each turn, consider switching if low HP & low fieldAdv.
    const currentT1 = t1ActiveRoster[t1Index];
    const currentT2 = t2ActiveRoster[t2Index];
    const maxHP = 100; // assume 100 is full HP for weighting purposes
    const avgT1Adv = t1ActiveRoster.reduce((sum, m) => sum + m.fieldAdv, 0) / t1ActiveRoster.length;
    const avgT2Adv = t2ActiveRoster.reduce((sum, m) => sum + m.fieldAdv, 0) / t2ActiveRoster.length;
    
    const switchProbT1 = computeSwitchProbability(currentT1.hp, maxHP, currentT1.fieldAdv, avgT1Adv);
    const switchProbT2 = computeSwitchProbability(currentT2.hp, maxHP, currentT2.fieldAdv, avgT2Adv);
    
    if (Math.random() < switchProbT1 && t1Switches < 7) {
      const nextIdx = findNextHealthyIndexWeighted(t1ActiveRoster, t1Index);
      if (nextIdx !== null) {
        t1Index = nextIdx;
        t1Switches++;
        battleLog.push(`${t1Name} switches to ${t1ActiveRoster[t1Index].nickname} (switch #${t1Switches})`);
      }
    }
    if (Math.random() < switchProbT2 && t2Switches < 7) {
      const nextIdx = findNextHealthyIndexWeighted(t2ActiveRoster, t2Index);
      if (nextIdx !== null) {
        t2Index = nextIdx;
        t2Switches++;
        battleLog.push(`${t2Name} switches to ${t2ActiveRoster[t2Index].nickname} (switch #${t2Switches})`);
      }
    }

    // Ensure active Pokémon are healthy; if not, force a switch.
    if (t1ActiveRoster[t1Index].fainted) {
      const nextIdx = findNextHealthyIndexWeighted(t1ActiveRoster, t1Index);
      if (nextIdx === null) {
        battleLog.push(`${t1Name} has no more Pokémon to send! ${t2Name} wins!`);
        return {
          log: battleLog,
          winner: t2Name,
          trainer1Team: team1Data.map(item => item.poke.nickname + item.suffix),
          trainer2Team: team2Data.map(item => item.poke.nickname + item.suffix),
        };
      }
      t1Index = nextIdx;
      battleLog.push(`${t1Name} sends in ${t1ActiveRoster[t1Index].nickname}!`);
    }
    if (t2ActiveRoster[t2Index].fainted) {
      const nextIdx = findNextHealthyIndexWeighted(t2ActiveRoster, t2Index);
      if (nextIdx === null) {
        battleLog.push(`${t2Name} has no more Pokémon to send! ${t1Name} wins!`);
        return {
          log: battleLog,
          winner: t1Name,
          trainer1Team: team1Data.map(item => item.poke.nickname + item.suffix),
          trainer2Team: team2Data.map(item => item.poke.nickname + item.suffix),
        };
      }
      t2Index = nextIdx;
      battleLog.push(`${t2Name} sends in ${t2ActiveRoster[t2Index].nickname}!`);
    }

    // Get current attackers
    const attacker1 = t1ActiveRoster[t1Index];
    const attacker2 = t2ActiveRoster[t2Index];

    // Simple damage calculation based on field advantage.
    const dmgFrom1to2 = Math.max(0, Math.floor(Math.random() * attacker1.fieldAdv / 10));
    const dmgFrom2to1 = Math.max(0, Math.floor(Math.random() * attacker2.fieldAdv / 10));

    attacker2.hp -= dmgFrom1to2;
    attacker1.hp -= dmgFrom2to1;

    if (attacker1.hp <= 0 && attacker2.hp <= 0) {
      if (attacker1.hp === attacker2.hp) {
        battleLog.push(`Both ${t1Name}'s ${attacker1.nickname} and ${t2Name}'s ${attacker2.nickname} fainted simultaneously!`);
        attacker1.fainted = true;
        attacker2.fainted = true;
      } else if (attacker1.hp > attacker2.hp) {
        attacker1.hp = 1;
        attacker2.fainted = true;
        battleLog.push(`${t2Name}'s ${attacker2.nickname} fainted!`);
      } else {
        attacker2.hp = 1;
        attacker1.fainted = true;
        battleLog.push(`${t1Name}'s ${attacker1.nickname} fainted!`);
      }
    } else {
      if (attacker1.hp <= 0) {
        attacker1.fainted = true;
        battleLog.push(`${t1Name}'s ${attacker1.nickname} fainted!`);
      }
      if (attacker2.hp <= 0) {
        attacker2.fainted = true;
        battleLog.push(`${t2Name}'s ${attacker2.nickname} fainted!`);
      }
    }
  }

  battleLog.push(`Reached ${MAX_TURNS} turns, calling it a draw!`);
  return {
    log: battleLog,
    winner: "Draw",
    trainer1Team: team1Data.map(item => item.poke.nickname + item.suffix),
    trainer2Team: team2Data.map(item => item.poke.nickname + item.suffix),
  };
}
