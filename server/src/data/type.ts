import { Types } from './enums/types';

export class PokemonType {
    constructor(
        public readonly id: Types,
        public readonly name: string,
        public readonly weaknesses: Types[],
        public readonly resistances: Types[],
        public readonly immunities: Types[] = [],
        public readonly color: string = '#000000'
    ) {}
    
    /** Check if a type is super effective against this one. */
    isWeakTo(attackingType: Types): boolean {
      return this.weaknesses.includes(attackingType);
    }
    
    /** Check if a type resists this one. */
    isResistantTo(attackingType: Types): boolean {
      return this.resistances.includes(attackingType);
    }
} 

export const allTypes: PokemonType[] = [];

export function initTypes(){
    allTypes.push(new PokemonType(Types.NORMAL, 'Normal', [Types.FIGHTING], [], [Types.GHOST], '#A8A77A'));
    allTypes.push(new PokemonType(Types.FIGHTING, 'Fighting', [Types.FLYING, Types.PSYCHIC, Types.FAIRY], [Types.NORMAL, Types.ROCK, Types.STEEL, Types.ICE, Types.DARK], [], '#C22E28'));
    allTypes.push(new PokemonType(Types.FLYING, 'Flying', [Types.ROCK, Types.ELECTRIC, Types.ICE], [Types.FIGHTING, Types.BUG, Types.GRASS], [Types.GROUND], '#A98FF3'));
    allTypes.push(new PokemonType(Types.POISON, 'Poison', [Types.GROUND, Types.PSYCHIC], [Types.FIGHTING, Types.POISON, Types.BUG, Types.GRASS, Types.FAIRY], [], '#A33EA1'));
    allTypes.push(new PokemonType(Types.GROUND, 'Ground', [Types.WATER, Types.GRASS, Types.ICE], [Types.POISON, Types.ROCK], [Types.ELECTRIC], '#E2BF65'));
    allTypes.push(new PokemonType(Types.ROCK, 'Rock', [Types.FIGHTING, Types.GROUND, Types.STEEL, Types.WATER, Types.GRASS], [Types.NORMAL, Types.FLYING, Types.POISON, Types.FIRE], [], '#B6A136'));
    allTypes.push(new PokemonType(Types.BUG, 'Bug', [Types.FLYING, Types.ROCK, Types.FIRE], [Types.FIGHTING, Types.GROUND, Types.GRASS], [], '#A6B91A'));
    allTypes.push(new PokemonType(Types.GHOST, 'Ghost', [Types.GHOST, Types.DARK], [Types.POISON, Types.BUG], [Types.NORMAL, Types.FIGHTING], '#735797'));
    allTypes.push(new PokemonType(Types.STEEL, 'Steel', [Types.FIGHTING, Types.GROUND, Types.FIRE], [Types.NORMAL, Types.FLYING, Types.ROCK, Types.BUG, Types.STEEL, Types.GRASS, Types.PSYCHIC, Types.ICE, Types.DRAGON, Types.FAIRY], [Types.POISON], '#B7B7CE'));
    allTypes.push(new PokemonType(Types.FIRE, 'Fire', [Types.GROUND, Types.ROCK, Types.WATER], [Types.BUG, Types.STEEL, Types.FIRE, Types.GRASS, Types.ICE, Types.FAIRY], [], '#EE8130'));
    allTypes.push(new PokemonType(Types.WATER, 'Water', [Types.GRASS, Types.ELECTRIC], [Types.STEEL, Types.FIRE, Types.WATER, Types.ICE], [], '#6390F0'));
    allTypes.push(new PokemonType(Types.GRASS, 'Grass', [Types.FLYING, Types.POISON, Types.BUG, Types.FIRE, Types.ICE], [Types.GROUND, Types.WATER, Types.GRASS, Types.ELECTRIC], [], '#7AC74C'));
    allTypes.push(new PokemonType(Types.ELECTRIC, 'Electric', [Types.GROUND], [Types.FLYING, Types.STEEL, Types.ELECTRIC], [], '#F7D02C'));
    allTypes.push(new PokemonType(Types.PSYCHIC, 'Psychic', [Types.BUG, Types.GHOST, Types.DARK], [Types.FIGHTING, Types.PSYCHIC], [], '#F95587'));
    allTypes.push(new PokemonType(Types.ICE, 'Ice', [Types.FIGHTING, Types.ROCK, Types.STEEL, Types.FIRE], [Types.ICE], [], '#96D9D6'));
    allTypes.push(new PokemonType(Types.DRAGON, 'Dragon', [Types.ICE, Types.DRAGON, Types.FAIRY], [Types.FIRE, Types.WATER, Types.GRASS, Types.ELECTRIC], [], '#6F35FC'));
    allTypes.push(new PokemonType(Types.DARK, 'Dark', [Types.FIGHTING, Types.BUG, Types.FAIRY], [Types.GHOST, Types.DARK], [], '#705746'));
    allTypes.push(new PokemonType(Types.FAIRY, 'Fairy', [Types.POISON, Types.STEEL], [Types.FIGHTING, Types.BUG, Types.DARK], [Types.DRAGON], '#D685AD'));
}