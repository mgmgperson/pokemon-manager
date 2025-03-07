import { Natures } from './enums/natures';
import { Stat } from './enums/stat';

export class Nature {
    constructor(
        public readonly id: Natures,
        public readonly name: string,
        public readonly increasedStat: Stat,
        public readonly decreasedStat: Stat
    ) {}

    /** Check if this nature is neutral (i.e., does not modify any stats). */
    isNeutral(): boolean {
        return this.increasedStat === this.decreasedStat;
    }
}

export const allNatures: Nature[] = [];

export function initNatures() {
    allNatures.push(new Nature(Natures.HARDY, 'Hardy', Stat.ATK, Stat.ATK));
    allNatures.push(new Nature(Natures.BOLD, 'Bold', Stat.DEF, Stat.ATK));
    allNatures.push(new Nature(Natures.MODEST, 'Modest', Stat.SPATK, Stat.ATK));
    allNatures.push(new Nature(Natures.CALM, 'Calm', Stat.SPDEF, Stat.ATK));
    allNatures.push(new Nature(Natures.TIMID, 'Timid', Stat.SPE, Stat.ATK));
    allNatures.push(new Nature(Natures.LONELY, 'Lonely', Stat.ATK, Stat.DEF));
    allNatures.push(new Nature(Natures.DOCILE, 'Docile', Stat.ATK, Stat.ATK));
    allNatures.push(new Nature(Natures.MILD, 'Mild', Stat.SPATK, Stat.DEF));
    allNatures.push(new Nature(Natures.GENTLE, 'Gentle', Stat.SPDEF, Stat.DEF));
    allNatures.push(new Nature(Natures.HASTY, 'Hasty', Stat.SPE, Stat.DEF));
    allNatures.push(new Nature(Natures.ADAMANT, 'Adamant', Stat.ATK, Stat.SPATK));
    allNatures.push(new Nature(Natures.IMPISH, 'Impish', Stat.DEF, Stat.SPATK));
    allNatures.push(new Nature(Natures.BASHFUL, 'Bashful', Stat.ATK, Stat.ATK));
    allNatures.push(new Nature(Natures.CAREFUL, 'Careful', Stat.SPDEF, Stat.SPATK));
    allNatures.push(new Nature(Natures.RASH, 'Rash', Stat.SPATK, Stat.SPDEF));
    allNatures.push(new Nature(Natures.JOLLY, 'Jolly', Stat.SPE, Stat.SPATK));
    allNatures.push(new Nature(Natures.NAUGHTY, 'Naughty', Stat.ATK, Stat.SPDEF));
    allNatures.push(new Nature(Natures.LAX, 'Lax', Stat.DEF, Stat.SPDEF));
    allNatures.push(new Nature(Natures.QUIRKY, 'Quirky', Stat.ATK, Stat.ATK));
    allNatures.push(new Nature(Natures.NAIVE, 'Naive', Stat.SPE, Stat.SPDEF));
    allNatures.push(new Nature(Natures.BRAVE, 'Brave', Stat.ATK, Stat.SPE));
    allNatures.push(new Nature(Natures.RELAXED, 'Relaxed', Stat.DEF, Stat.SPE));
    allNatures.push(new Nature(Natures.QUIET, 'Quiet', Stat.SPATK, Stat.SPE));
    allNatures.push(new Nature(Natures.SASSY, 'Sassy', Stat.SPDEF, Stat.SPE));
    allNatures.push(new Nature(Natures.SERIOUS, 'Serious', Stat.ATK, Stat.ATK));
}