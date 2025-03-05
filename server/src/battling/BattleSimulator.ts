// src/battling/BattleSimulator.ts

import { PokemonRow, TrainerRow } from '../types/database';
import { computeFieldAdv } from './TeamPicker';
import { fetchTrainer } from '../services/dbService';

export interface BattleResult {
  log: string[];
  winner: string;
  trainer1Team: string[];
  trainer2Team: string[];
}

/**
 * Simulate a naive 6v6 singles battle. 
 * We'll do:
 *  - Each side starts with the first Pokemon in the array
 *  - Turn-based damage based on "fieldAdv" difference
 *  - Random chance of switching if losing, max 7 switches
 */
export async function simulateSingles6v6Battle(
  field: string,
  trainer1Id: number,
  trainer2Id: number,
  team1: PokemonRow[],
  team2: PokemonRow[]
): Promise<BattleResult> {

  const battleLog: string[] = [];
  // fetch trainer names
  const t1 = await fetchTrainer(trainer1Id);
  const t2 = await fetchTrainer(trainer2Id);
  const t1Name = t1 ? `${t1.fname} ${t1.lname}` : `Trainer ${trainer1Id}`;
  const t2Name = t2 ? `${t2.fname} ${t2.lname}` : `Trainer ${trainer2Id}`;

  battleLog.push(`** ${t1Name} selected: ${team1.map(p => p.nickname).join(', ')} **`);
  battleLog.push(`** ${t2Name} selected: ${team2.map(p => p.nickname).join(', ')} **`);

  // Build "active" roster objects with HP and precomputed fieldAdv
  interface ActiveMon {
    nickname: string;
    hp: number;
    fieldAdv: number;
    fainted: boolean;
  }

  // Precompute advantage for each mon
  const t1ActiveRoster: ActiveMon[] = [];
  for (const p of team1) {
    const adv = await computeFieldAdv(p, field, trainer1Id);
    t1ActiveRoster.push({
      nickname: p.nickname || 'NoName',
      hp: p.current_hp ?? 50, // default
      fieldAdv: adv,
      fainted: false,
    });
  }

  const t2ActiveRoster: ActiveMon[] = [];
  for (const p of team2) {
    const adv = await computeFieldAdv(p, field, trainer2Id);
    t2ActiveRoster.push({
      nickname: p.nickname || 'NoName',
      hp: p.current_hp ?? 50, 
      fieldAdv: adv,
      fainted: false,
    });
  }

  let t1Index = 0;
  let t2Index = 0;
  let t1Switches = 0;
  let t2Switches = 0;
  
  battleLog.push(`${t1Name} sends out ${t1ActiveRoster[t1Index].nickname}!`);
  battleLog.push(`${t2Name} sends out ${t2ActiveRoster[t2Index].nickname}!`);

  const MAX_TURNS = 200;
  let turn = 0;

  function allFainted(roster: ActiveMon[]): boolean {
    return roster.every(m => m.fainted);
  }

  function findNextHealthyIndex(roster: ActiveMon[], currentIdx: number): number | null {
    for (let i = 0; i < roster.length; i++) {
      if (!roster[i].fainted && i !== currentIdx) {
        return i;
      }
    }
    return null;
  }

  while (turn < MAX_TURNS) {
    turn++;

    if (allFainted(t1ActiveRoster)) {
      battleLog.push(`${t1Name} is out of usable Pokémon! ${t2Name} wins!`);
      return {
        log: battleLog,
        winner: t2Name,
        trainer1Team: team1.map(p => p.nickname || 'NoName'),
        trainer2Team: team2.map(p => p.nickname || 'NoName'),
      };
    }
    if (allFainted(t2ActiveRoster)) {
      battleLog.push(`${t2Name} is out of usable Pokémon! ${t1Name} wins!`);
      return {
        log: battleLog,
        winner: t1Name,
        trainer1Team: team1.map(p => p.nickname || 'NoName'),
        trainer2Team: team2.map(p => p.nickname || 'NoName'),
      };
    }

    // If active mon is fainted, switch automatically
    if (t1ActiveRoster[t1Index].fainted) {
      const nextIdx = findNextHealthyIndex(t1ActiveRoster, t1Index);
      if (nextIdx === null) {
        // no more healthy mons
        battleLog.push(`${t1Name} has no more Pokémon to send! ${t2Name} wins!`);
        return {
          log: battleLog,
          winner: t2Name,
          trainer1Team: team1.map(p => p.nickname || 'NoName'),
          trainer2Team: team2.map(p => p.nickname || 'NoName'),
        };
      }
      t1Index = nextIdx;
      battleLog.push(`${t1Name} sends in ${t1ActiveRoster[t1Index].nickname}!`);
    }
    if (t2ActiveRoster[t2Index].fainted) {
      const nextIdx = findNextHealthyIndex(t2ActiveRoster, t2Index);
      if (nextIdx === null) {
        battleLog.push(`${t2Name} has no more Pokémon to send! ${t1Name} wins!`);
        return {
          log: battleLog,
          winner: t1Name,
          trainer1Team: team1.map(p => p.nickname || 'NoName'),
          trainer2Team: team2.map(p => p.nickname || 'NoName'),
        };
      }
      t2Index = nextIdx;
      battleLog.push(`${t2Name} sends in ${t2ActiveRoster[t2Index].nickname}!`);
    }

    const t1Mon = t1ActiveRoster[t1Index];
    const t2Mon = t2ActiveRoster[t2Index];

    // Maybe do random switching if losing
    if (Math.random() < 0.25 && t1Mon.hp < 20 && t1Switches < 7) {
      const altIdx = findNextHealthyIndex(t1ActiveRoster, t1Index);
      if (altIdx !== null) {
        t1Index = altIdx;
        t1Switches++;
        battleLog.push(`${t1Name} switches to ${t1ActiveRoster[t1Index].nickname} (switch #${t1Switches})`);
      }
    }
    if (Math.random() < 0.25 && t2Mon.hp < 20 && t2Switches < 7) {
      const altIdx = findNextHealthyIndex(t2ActiveRoster, t2Index);
      if (altIdx !== null) {
        t2Index = altIdx;
        t2Switches++;
        battleLog.push(`${t2Name} switches to ${t2ActiveRoster[t2Index].nickname} (switch #${t2Switches})`);
      }
    }

    // Re-reference after any switch
    const attacker1 = t1ActiveRoster[t1Index];
    const attacker2 = t2ActiveRoster[t2Index];
    const healthFactor1 = Math.max(0, attacker1.hp) / 100;
    const healthFactor2 = Math.max(0, attacker2.hp) / 100;

    const dmgFrom1to2 = Math.max(
      0,
      Math.floor(Math.random() * (attacker1.fieldAdv)/10 * healthFactor1)
    );
    const dmgFrom2to1 = Math.max(
      0,
      Math.floor(Math.random() * (attacker2.fieldAdv)/10 * healthFactor2)
    );

    attacker2.hp -= dmgFrom1to2;
    attacker1.hp -= dmgFrom2to1;

    // battleLog.push(
    //   `Turn ${turn}: ${t1Name}'s ${attacker1.nickname} does ${dmgFrom1to2} dmg to ${attacker2.nickname} (HP: ${Math.max(
    //     0,
    //     attacker2.hp
    //   )}), ` +
    //   `${t2Name}'s ${attacker2.nickname} does ${dmgFrom2to1} dmg to ${attacker1.nickname} (HP: ${Math.max(
    //     0,
    //     attacker1.hp
    //   )})`
    // );

    if (attacker1.hp <= 0) {
      attacker1.fainted = true;
      battleLog.push(`${t1Name}'s ${attacker1.nickname} fainted!`);
    }
    if (attacker2.hp <= 0) {
      attacker2.fainted = true;
      battleLog.push(`${t2Name}'s ${attacker2.nickname} fainted!`);
    }
  }

  // If we reach here, we reached MAX_TURNS => draw
  battleLog.push(`Reached ${MAX_TURNS} turns, calling it a draw!`);
  return {
    log: battleLog,
    winner: 'Draw',
    trainer1Team: team1.map(p => p.nickname || 'NoName'),
    trainer2Team: team2.map(p => p.nickname || 'NoName'),
  };
}
