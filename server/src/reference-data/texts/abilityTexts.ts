import { Abilities } from "../enums/abilities";

export const abilityEffects: Record<Abilities, { effect: string, shortEffect: string, flavorText: string }> = {
    [Abilities.STENCH]: {
        effect: "This Pokémon's damaging moves have a 10% chance to make the target flinch with each hit if they do not already cause flinching as a secondary effect.  This ability does not stack with a held item.  Overworld: The wild encounter rate is halved while this Pokémon is first in the party.",
        shortEffect: "Has a 10% chance of making target Pokémon flinch with each hit.",
        flavorText: "By releasing a stench when attacking, the Pokémon may cause the target to flinch."
    },
    [Abilities.DRIZZLE]: {
        effect: "The weather changes to rain when this Pokémon enters battle and does not end unless replaced by another weather condition.  If multiple Pokémon with this ability, drought, sand stream, or snow warning are sent out at the same time, the abilities will activate in order of Speed, respecting trick room.  Each ability's weather will cancel the previous weather, and only the weather summoned by the slowest of the Pokémon will stay.",
        shortEffect: "Summons rain that lasts indefinitely upon entering battle.",
        flavorText: "The Pokémon makes it rain when it enters a battle."
    },
    [Abilities.SPEED_BOOST]: {
        effect: "This Pokémon's Speed rises one stage after each turn.",
        shortEffect: "Raises Speed one stage after each turn.",
        flavorText: "The Pokémon's Speed stat is boosted every turn."
    },
    [Abilities.BATTLE_ARMOR]: {
        effect: "Moves cannot score critical hits against this Pokémon.  This ability functions identically to shell armor.",
        shortEffect: "Protects against critical hits.",
        flavorText: "Hard armor protects the Pokémon from critical hits."
    },
    [Abilities.STURDY]: {
        effect: "When this Pokémon is at full HP, any hit that would knock it out will instead leave it with 1 HP.  Regardless of its current HP, it is also immune to the one-hit KO moves: fissure, guillotine, horn drill, and sheer cold.  If this Pokémon is holding a focus sash, this ability takes precedence and the item will not be consumed.",
        shortEffect: "Prevents being KOed from full HP, leaving 1 HP instead.  Protects against the one-hit KO moves regardless of HP.",
        flavorText: "The Pokémon cannot be knocked out by a single hit as long as its HP is full. One-hit KO moves will also fail to knock it out."
    },
    [Abilities.DAMP]: {
        effect: "While this Pokémon is in battle, self destruct and explosion will fail and aftermath will not take effect.",
        shortEffect: "Prevents self destruct, explosion, and aftermath from working while the Pokémon is in battle.",
        flavorText: "The Pokémon dampens its surroundings, preventing all Pokémon from using explosive moves such as Self-Destruct."
    },
    [Abilities.LIMBER]: {
        effect: "This Pokémon cannot be paralyzed.  If a Pokémon is paralyzed and acquires this ability, its paralysis is healed; this includes when regaining a lost ability upon leaving battle.",
        shortEffect: "Prevents paralysis.",
        flavorText: "The Pokémon's limber body prevents it from being paralyzed."
    },
    [Abilities.SAND_VEIL]: {
        effect: "During a sandstorm, this Pokémon has 1.25× its evasion, and it does not take sandstorm damage regardless of type.  The evasion bonus does not count as a stat modifier.  Overworld: If the lead Pokémon has this ability, the wild encounter rate is halved in a sandstorm.",
        shortEffect: "Increases evasion to 1.25× during a sandstorm.  Protects against sandstorm damage.",
        flavorText: "Boosts the Pokémon's evasiveness in a sandstorm."
    },
    [Abilities.STATIC]: {
        effect: "Whenever a move makes contact with this Pokémon, the move's user has a 30% chance of being paralyzed.  Pokémon that are immune to electric-type moves can still be paralyzed by this ability.  Overworld: If the lead Pokémon has this ability, there is a 50% chance that encounters will be with an electric Pokémon, if applicable.",
        shortEffect: "Has a 30% chance of paralyzing attacking Pokémon on contact.",
        flavorText: "The Pokémon is charged with static electricity and may paralyze attackers that make direct contact with it."
    },
    [Abilities.VOLT_ABSORB]: {
        effect: "Whenever an electric-type move hits this Pokémon, it heals for 1/4 of its maximum HP, negating any other effect on it.  This ability will not take effect if this Pokémon is ground-type and thus immune to Electric moves.  Electric moves will ignore this Pokémon's substitute.  This effect includes non-damaging moves, i.e. thunder wave.",
        shortEffect: "Absorbs electric moves, healing for 1/4 max HP.",
        flavorText: "If hit by an Electric-type move, the Pokémon has its HP restored instead of taking damage."
    },
    [Abilities.WATER_ABSORB]: {
        effect: "Whenever a water-type move hits this Pokémon, it heals for 1/4 of its maximum HP, negating any other effect on it.  Water moves will ignore this Pokémon's substitute.",
        shortEffect: "Absorbs water moves, healing for 1/4 max HP.",
        flavorText: "If hit by a Water-type move, the Pokémon has its HP restored instead of taking damage."
    },
    [Abilities.OBLIVIOUS]: {
        effect: "This Pokémon cannot be infatuated and is immune to captivate.  If a Pokémon is infatuated and acquires this ability, its infatuation is cleared.",
        shortEffect: "Prevents infatuation and protects against captivate.",
        flavorText: "The Pokémon is oblivious, keeping it from being infatuated, falling for taunts, or being affected by Intimidate."
    },
    [Abilities.CLOUD_NINE]: {
        effect: "While this Pokémon is in battle, weather can still be in play, but will not have any of its effects.  This ability functions identically to air lock.",
        shortEffect: "Negates all effects of weather, but does not prevent the weather itself.",
        flavorText: "Eliminates the effects of weather."
    },
    [Abilities.COMPOUND_EYES]: {
        effect: "This Pokémon's moves have 1.3× their accuracy.  This ability has no effect on the one-hit KO moves (fissure, guillotine, horn drill, and sheer cold).  Overworld: If the first Pokémon in the party has this ability, the chance of a wild Pokémon holding a particular item is raised from 50%, 5%, or 1% to 60%, 20%, or 5%, respectively.",
        shortEffect: "Increases moves' accuracy to 1.3×.",
        flavorText: "The Pokémon's compound eyes boost its accuracy."
    },
    [Abilities.INSOMNIA]: {
        effect: "This Pokémon cannot be asleep.  This causes rest to fail altogether.  If a Pokémon is asleep and acquires this ability, it will immediately wake up; this includes when regaining a lost ability upon leaving battle.  This ability functions identically to vital spirit in battle.",
        shortEffect: "Prevents sleep.",
        flavorText: "The Pokémon's insomnia prevents it from falling asleep."
    },
    [Abilities.COLOR_CHANGE]: {
        effect: "Whenever this Pokémon takes damage from a move, the Pokémon's type changes to match the move.  If the Pokémon has two types, both are overridden.  The Pokémon must directly take damage; for example, moves blocked by a substitute will not trigger this ability, nor will moves that deal damage indirectly, such as spikes.  This ability takes effect on only the last hit of a multiple-hit attack.  In Pokémon Colosseum and XD: Gale of Darkness, this ability does not take effect on Shadow-type moves.",
        shortEffect: "Changes type to match when hit by a damaging move.",
        flavorText: "The Pokémon’s type becomes the type of the move used on it."
    },
    [Abilities.IMMUNITY]: {
        effect: "This Pokémon cannot be poisoned.  This includes bad poison.  If a Pokémon is poisoned and acquires this ability, its poison is healed; this includes when regaining a lost ability upon leaving battle.",
        shortEffect: "Prevents poison.",
        flavorText: "The Pokémon's immune system prevents it from being poisoned."
    },
    [Abilities.FLASH_FIRE]: {
        effect: "This Pokémon is immune to fire-type moves.  Once this Pokémon has been hit by a Fire move, its own Fire moves will inflict 1.5× as much damage until it leaves battle.  This ability has no effect while the Pokémon is frozen.  The Fire damage bonus is retained even if the Pokémon is frozen and thawed or the ability is lost or disabled.  Fire moves will ignore this Pokémon's substitute.  This ability takes effect even on non-damaging moves, i.e. will o wisp.",
        shortEffect: "Protects against fire moves.  Once one has been blocked, the Pokémon's own Fire moves inflict 1.5× damage until it leaves battle.",
        flavorText: "If hit by a Fire-type move, the Pokémon absorbs the flames and uses them to power up its own Fire-type moves."
    },
    [Abilities.SHIELD_DUST]: {
        effect: "This Pokémon is immune to the extra effects of moves used against it.  An extra effect is a move's chance, listed as an 'effect chance', to inflict a status ailment, cause a stat change, or make the target flinch in addition to the move's main effect.  For example, thunder shock's paralysis is an extra effect, but thunder wave's is not, nor are knock off's item removal and air cutter's increased critical hit rate.",
        shortEffect: "Protects against incoming moves' extra effects.",
        flavorText: "Protective dust shields the Pokémon from the additional effects of moves."
    },
    [Abilities.OWN_TEMPO]: {
        effect: "This Pokémon cannot be confused.  If a Pokémon is confused and acquires this ability, its confusion will immediately be healed.",
        shortEffect: "Prevents confusion.",
        flavorText: "The Pokémon sticks to its own tempo, preventing it from becoming confused or being affected by Intimidate."
    },
    [Abilities.SUCTION_CUPS]: {
        effect: "This Pokémon cannot be forced out of battle by moves such as whirlwind.  dragon tail and circle throw still inflict damage against this Pokémon.  Overworld: If the lead Pokémon has this ability, the success rate while fishing is increased.",
        shortEffect: "Prevents being forced out of battle by other Pokémon's moves.",
        flavorText: "The Pokémon uses suction cups to stay in one spot. This protects it from moves and items that would force it to switch out."
    },
    [Abilities.INTIMIDATE]: {
        effect: "When this Pokémon enters battle, the opponent's Attack is lowered by one stage.  In a double battle, both opponents are affected.  This ability also takes effect when acquired during a battle, but will not take effect again if lost and reobtained without leaving battle.  This ability has no effect on an opponent that has a substitute.  Overworld: If the first Pokémon in the party has this ability, any random encounter with a Pokémon five or more levels lower than it has a 50% chance of being skipped.",
        shortEffect: "Lowers opponents' Attack one stage upon entering battle.",
        flavorText: "When the Pokémon enters a battle, it intimidates opposing Pokémon and makes them cower, lowering their Attack stats."
    },
    [Abilities.SHADOW_TAG]: {
        effect: "While this Pokémon is in battle, opposing Pokémon cannot flee or switch out.  Other Pokémon with this ability are unaffected.  Pokémon with run away can still flee.  Pokémon can still switch out with the use of a move or item.",
        shortEffect: "Prevents opponents from fleeing or switching out.",
        flavorText: "The Pokémon steps on the opposing Pokémon's shadows to prevent them from fleeing or switching out."
    },
    [Abilities.ROUGH_SKIN]: {
        effect: "Whenever a move makes contact with this Pokémon, the move's user takes 1/8 of its maximum HP in damage.  This ability functions identically to iron barbs.",
        shortEffect: "Damages attacking Pokémon for 1/8 their max HP on contact.",
        flavorText: "The Pokémon's rough skin damages attackers that make direct contact with it."
    },
    [Abilities.WONDER_GUARD]: {
        effect: "This Pokémon is immune to damaging moves that are not super effective against it.  Moves that inflict fixed damage, such as night shade or seismic toss, are considered super effective if their types are.  Damage not directly dealt by moves, such as damage from weather, a status ailment, or spikes, is not prevented.  This ability cannot be copied with role play or traded away with skill swap, but it can be copied with trace, disabled with gastro acid, or changed with worry seed.  This Pokémon can still use Role Play itself to lose this ability, but not Skill Swap.  If this Pokémon has a substitute, this ability will block moves as usual and any moves not blocked will react to the Substitute as usual.",
        shortEffect: "Protects against damaging moves that are not super effective.",
        flavorText: "Its mysterious power only lets supereffective moves hit the Pokémon."
    },
    [Abilities.LEVITATE]: {
        effect: "This Pokémon is immune to ground-type moves, spikes, toxic spikes, and arena trap.  This ability is disabled during gravity or ingrain, or while holding an iron ball.  This ability is not disabled during roost.",
        shortEffect: "Evades ground moves.",
        flavorText: "By floating in the air, the Pokémon receives full immunity to all Ground-type moves."
    },
    [Abilities.EFFECT_SPORE]: {
        effect: "Whenever a move makes contact with this Pokémon, the move's user has a 30% chance of being paralyzed, poisoned, or put to sleep, chosen at random.  Nothing is done to compensate if the move's user is immune to one of these ailments; there is simply a lower chance that the move's user will be affected.",
        shortEffect: "Has a 30% chance of inflcting either paralysis, poison, or sleep on attacking Pokémon on contact.",
        flavorText: "Contact with the Pokémon may inflict poison, sleep, or paralysis on the attacker."
    },
    [Abilities.SYNCHRONIZE]: {
        effect: "Whenever this Pokémon is burned, paralyzed, or poisoned, the Pokémon who gave this Pokémon that ailment is also given the ailment.  This ability passes back bad poison when this Pokémon is badly poisoned.  This ability cannot pass on a status ailment that the Pokémon did not directly receive from another Pokémon, such as the poison from toxic spikes or the burn from a flame orb.  Overworld: If the lead Pokémon has this ability, wild Pokémon have a 50% chance of having the lead Pokémon's nature, and a 50% chance of being given a random nature as usual, including the lead Pokémon's nature.  This does not work on Pokémon received outside of battle or roaming legendaries.",
        shortEffect: "Copies burns, paralysis, and poison received onto the Pokémon that inflicted them.",
        flavorText: "If the Pokémon is burned, paralyzed, or poisoned by another Pokémon, that Pokémon will be inflicted with the same status condition."
    },
    [Abilities.CLEAR_BODY]: {
        effect: "This Pokémon cannot have its stats lowered by other Pokémon.  This ability does not prevent any stat losses other than stat modifiers, such as the Speed cut from paralysis.  This Pokémon can still be passed negative stat modifiers through guard swap, heart swap, or power swap.  This ability functions identically to white smoke in battle.",
        shortEffect: "Prevents stats from being lowered by other Pokémon.",
        flavorText: "Prevents other Pokémon's moves or Abilities from lowering the Pokémon's stats."
    },
    [Abilities.NATURAL_CURE]: {
        effect: "This Pokémon is cured of any major status ailment when it is switched out for another Pokémon.  If this ability is acquired during battle, the Pokémon is cured upon leaving battle before losing the temporary ability.",
        shortEffect: "Cures any major status ailment upon switching out.",
        flavorText: "The Pokémon's status conditions are cured when it switches out."
    },
    [Abilities.LIGHTNING_ROD]: {
        effect: "All other Pokémon's single-target electric-type moves are redirected to this Pokémon if it is an eligible target.  Other Pokémon's Electric moves raise this Pokémon's Special Attack one stage, negating any other effect on it, and cannot miss it.  If the move's intended target also has this ability, the move is not redirected.  When multiple Pokémon with this ability are possible targets for redirection, the move is redirected to the one with the highest Speed stat, or, in the case of a tie, to a random tied Pokémon.  follow me takes precedence over this ability.  If the Pokémon is a ground-type and thus immune to Electric moves, its immunity prevents the Special Attack boost.",
        shortEffect: "Redirects single-target electric moves to this Pokémon where possible.  Absorbs Electric moves, raising Special Attack one stage.",
        flavorText: "The Pokémon draws in all Electric-type moves. Instead of taking damage from them, its Sp. Atk stat is boosted."
    },
    [Abilities.SERENE_GRACE]: {
        effect: "This Pokémon's moves have twice their usual effect chance.  An effect chance is a move's chance to inflict a status ailment, cause a stat change, or make the target flinch in addition to the move's main effect.  For example, flamethrower's chance of burning the target is doubled, but protect's chance of success and air cutter's increased critical hit rate are unaffected.  secret power is unaffected.",
        shortEffect: "Doubles the chance of moves' extra effects occurring.",
        flavorText: "Raises the likelihood of additional effects occurring when the Pokémon uses its moves."
    },
    [Abilities.SWIFT_SWIM]: {
        effect: "This Pokémon's Speed is doubled during rain.  This bonus does not count as a stat modifier.",
        shortEffect: "Doubles Speed during rain.",
        flavorText: "Boosts the Pokémon's Speed stat in rain."
    },
    [Abilities.CHLOROPHYLL]: {
        effect: "This Pokémon's Speed is doubled during strong sunlight.  This bonus does not count as a stat modifier.",
        shortEffect: "Doubles Speed during strong sunlight.",
        flavorText: "Boosts the Pokémon's Speed stat in harsh sunlight."
    },
    [Abilities.ILLUMINATE]: {
        effect: "Overworld: If the lead Pokémon has this ability, the wild encounter rate is doubled.  This ability has no effect in battle.",
        shortEffect: "Doubles the wild encounter rate.",
        flavorText: "By illuminating its surroundings, the Pokémon prevents its accuracy from being lowered."
    },
    [Abilities.TRACE]: {
        effect: "When this Pokémon enters battle, it copies a random opponent's ability.  This ability cannot copy flower gift, forecast, illusion, imposter, multitype, trace, wonder guard, or zen mode.",
        shortEffect: "Copies an opponent's ability upon entering battle.",
        flavorText: "When it enters a battle, the Pokémon copies an opposing Pokémon's Ability."
    },
    [Abilities.HUGE_POWER]: {
        effect: "This Pokémon's Attack is doubled while in battle.  This bonus does not count as a stat modifier.  This ability functions identically to pure power.",
        shortEffect: "Doubles Attack in battle.",
        flavorText: "Doubles the Pokémon's Attack stat."
    },
    [Abilities.POISON_POINT]: {
        effect: "Whenever a move makes contact with this Pokémon, the move's user has a 30% chance of being poisoned.",
        shortEffect: "Has a 30% chance of poisoning attacking Pokémon on contact.",
        flavorText: "Contact with the Pokémon may poison the attacker."
    },
    [Abilities.INNER_FOCUS]: {
        effect: "This Pokémon cannot flinch.",
        shortEffect: "Prevents flinching.",
        flavorText: "The Pokémon's intense focus prevents it from flinching or being affected by Intimidate."
    },
    [Abilities.MAGMA_ARMOR]: {
        effect: "This Pokémon cannot be frozen.  If a Pokémon is frozen and acquires this ability, it will immediately thaw out; this includes when regaining a lost ability upon leaving battle.  Overworld: If any Pokémon in the party has this ability, each egg in the party has its hatch counter decreased by 2 (rather than 1) each step cycle, making eggs hatch roughly twice as quickly.  This effect does not stack if multiple Pokémon have this ability or flame body.",
        shortEffect: "Prevents freezing.",
        flavorText: "The Pokémon’s hot magma coating prevents it from being frozen."
    },
    [Abilities.WATER_VEIL]: {
        effect: "This Pokémon cannot be burned.  If a Pokémon is burned and acquires this ability, its burn is healed; this includes when regaining a lost ability upon leaving battle.",
        shortEffect: "Prevents burns.",
        flavorText: "The Pokémon's water veil prevents it from being burned."
    },
    [Abilities.MAGNET_PULL]: {
        effect: "While this Pokémon is in battle, opposing steel-type Pokémon cannot flee or switch out.  Pokémon with run away can still flee.  Pokémon can still switch out with the use of a move or item.  Overworld: If the lead Pokémon has this ability, Steel-type Pokémon have a higher encounter rate.",
        shortEffect: "Prevents steel opponents from fleeing or switching out.",
        flavorText: "Prevents Steel-type Pokémon from fleeing by pulling them in with magnetism."
    },
    [Abilities.SOUNDPROOF]: {
        effect: "This Pokémon is immune to moves flagged as being sound-based.  heal bell is unaffected.  uproar still prevents this Pokémon from sleeping.  This Pokémon can still receive a Perish Song counter through baton pass, and will retain a Perish Song counter if it acquires this ability after Perish Song is used.  howl, roar of time, sonic boom, and yawn are not flagged as sound-based.",
        shortEffect: "Protects against sound-based moves.",
        flavorText: "Soundproofing gives the Pokémon full immunity to all sound-based moves."
    },
    [Abilities.RAIN_DISH]: {
        effect: "This Pokémon heals for 1/16 of its maximum HP after each turn during rain.",
        shortEffect: "Heals for 1/16 max HP after each turn during rain.",
        flavorText: "The Pokémon gradually regains HP in rain."
    },
    [Abilities.SAND_STREAM]: {
        effect: "The weather changes to a sandstorm when this Pokémon enters battle and does not end unless cancelled by another weather condition.  If multiple Pokémon with this ability, drizzle, drought, or snow warning are sent out at the same time, the abilities will activate in order of Speed, respecting trick room.  Each ability's weather will cancel the previous weather, and only the weather summoned by the slowest of the Pokémon will stay.  Overworld: If the lead Pokémon has this ability, the wild encounter rate is halved in a sandstorm.",
        shortEffect: "Summons a sandstorm that lasts indefinitely upon entering battle.",
        flavorText: "The Pokémon summons a sandstorm when it enters a battle."
    },
    [Abilities.PRESSURE]: {
        effect: "Moves targetting this Pokémon use one extra PP.  This ability stacks if multiple targets have it.  This ability still affects moves that fail or miss.  This ability does not affect ally moves that target either the entire field or just its side, nor this Pokémon's self-targetted moves; it does, however, affect single-targetted ally moves aimed at this Pokémon, ally moves that target all other Pokémon, and opponents' moves that target the entire field.  If this ability raises a move's PP cost above its remaining PP, it will use all remaining PP.  When this Pokémon enters battle, all participating trainers are notified that it has this ability.  Overworld: If the lead Pokémon has this ability, higher-levelled Pokémon have their encounter rate increased.",
        shortEffect: "Increases the PP cost of moves targetting the Pokémon by one.",
        flavorText: "Puts other Pokémon under pressure, causing them to expend more PP to use their moves."
    },
    [Abilities.THICK_FAT]: {
        effect: "This Pokémon takes half as much damage from fire- and ice-type moves.",
        shortEffect: "Halves damage from fire and ice moves.",
        flavorText: "The Pokémon is protected by a layer of thick fat, which halves the damage taken from Fire- and Ice-type moves."
    },
    [Abilities.EARLY_BIRD]: {
        effect: "This Pokémon's remaining sleep turn count falls by 2 rather than 1.  If this Pokémon's sleep counter is at 1, it will fall to 0 and then the Pokémon will wake up.",
        shortEffect: "Makes sleep pass twice as quickly.",
        flavorText: "The Pokémon awakens from sleep twice as fast as other Pokémon."
    },
    [Abilities.FLAME_BODY]: {
        effect: "Whenever a move makes contact with this Pokémon, the move's user has a 30% chance of being burned.  Overworld: If any Pokémon in the party has this ability, each egg in the party has its hatch counter decreased by 2 (rather than 1) each step cycle, making eggs hatch roughly twice as quickly.  This effect does not stack if multiple Pokémon have this ability or magma armor.",
        shortEffect: "Has a 30% chance of burning attacking Pokémon on contact.",
        flavorText: "Contact with the Pokémon may burn the attacker."
    },
    [Abilities.RUN_AWAY]: {
        effect: "This Pokémon is always successful fleeing from wild battles, even if trapped by a move or ability.",
        shortEffect: "Ensures success fleeing from wild battles.",
        flavorText: "Enables a sure getaway from wild Pokémon."
    },
    [Abilities.KEEN_EYE]: {
        effect: "This Pokémon cannot have its accuracy lowered.  This ability does not prevent any accuracy losses other than stat modifiers, such as the accuracy cut from fog; nor does it prevent other Pokémon's evasion from making this Pokémon's moves less accurate.  This Pokémon can still be passed negative accuracy modifiers through heart swap.  Overworld: If the first Pokémon in the party has this ability, any random encounter with a Pokémon five or more levels lower than it has a 50% chance of being skipped.",
        shortEffect: "Prevents accuracy from being lowered.",
        flavorText: "The Pokémon's keen eyes prevent its accuracy from being lowered."
    },
    [Abilities.HYPER_CUTTER]: {
        effect: "This Pokémon's Attack cannot be lowered by other Pokémon.  This ability does not prevent any Attack losses other than stat modifiers, such as the Attack cut from a burn.  This Pokémon can still be passed negative Attack modifiers through heart swap or power swap.",
        shortEffect: "Prevents Attack from being lowered by other Pokémon.",
        flavorText: "The Pokémon's prized, mighty pincers prevent other Pokémon from lowering its Attack stat."
    },
    [Abilities.PICKUP]: {
        effect: "At the end of each turn, if another Pokémon consumed or Flung a held item that turn, this Pokémon picks up the item if it is not already holding one.  After each battle, this Pokémon has a 10% chance of picking up an item if it is not already holding one.  The air balloon and eject button cannot be picked up.  The items that may be found vary by game, and, since Pokémon Emerald, by the Pokémon's level.  This ability is checked after the battle ends, at which point any temporary ability changes have worn off.",
        shortEffect: "Picks up other Pokémon's used and Flung held items.  May also pick up an item after battle.",
        flavorText: "The Pokémon may pick up an item another Pokémon used during a battle. It may pick up items outside of battle, too."
    },
    [Abilities.TRUANT]: {
        effect: "Every second turn on which this Pokémon should attempt to use a move, it will instead do nothing ('loaf around').  Loafing around interrupts moves that take multiple turns the same way paralysis, flinching, etc do.  Most such moves, for example bide or rollout, are simply cut off upon loafing around.  Attacks with a recharge turn, such as hyper beam, do not have to recharge; attacks with a preparation turn, such as fly, do not end up being used.  Moves that are forced over multiple turns and keep going through failure, such as outrage, uproar, or any move forced by encore, keep going as usual.  If this Pokémon is confused, its confusion is not checked when loafing around; the Pokémon cannot hurt itself, and its confusion does not end or come closer to ending.  If this Pokémon attempts to move but fails, e.g. because of paralysis or gravity, it still counts as having moved and will loaf around the next turn.  If it does not attempt to move, e.g. because it is asleep or frozen, whatever it would have done will be postponed until its next attempt; that is, it will either loaf around or move as usual, depending on what it last did.  This ability cannot be changed with worry seed, but it can be disabled with gastro acid, changed with role play, or traded away with skill swap.",
        shortEffect: "Skips every second turn.",
        flavorText: "Each time the Pokémon uses a move, it spends the next turn loafing around."
    },
    [Abilities.HUSTLE]: {
        effect: "This Pokémon's physical moves do 1.5× as much regular damage, but have 0.8× their usual accuracy.  Special moves are unaffected.  Moves that do set damage, such as seismic toss, have their accuracy affected, but not their damage.  Overworld: If the lead Pokémon has this ability, higher-levelled Pokémon have their encounter rate increased.",
        shortEffect: "Strengthens physical moves to inflict 1.5× damage, but decreases their accuracy to 0.8×.",
        flavorText: "Boosts the Pokémon's Attack stat but lowers its accuracy."
    },
    [Abilities.CUTE_CHARM]: {
        effect: "Whenever a move makes contact with this Pokémon, the move's user has a 30% chance of being infatuated.  Overworld: If the first Pokémon in the party has this ability, any wild Pokémon whose species can be either gender has a 2/3 chance of being set to the opposite gender, and a 1/3 chance of having a random gender as usual.",
        shortEffect: "Has a 30% chance of infatuating attacking Pokémon on contact.",
        flavorText: "The Pokémon may infatuate attackers that make direct contact with it."
    },
    [Abilities.PLUS]: {
        effect: "This Pokémon has 1.5× its Special Attack if any friendly Pokémon has plus or minus.  This bonus does not count as a stat modifier.  If either ability is disabled by gastro acid, both lose their effect.",
        shortEffect: "Increases Special Attack to 1.5× when a friendly Pokémon has plus or minus.",
        flavorText: "Boosts the Sp. Atk stat of the Pokémon if an ally with the Plus or Minus Ability is also in battle."
    },
    [Abilities.MINUS]: {
        effect: "This Pokémon has 1.5× its Special Attack if any friendly Pokémon has plus or minus.  This bonus does not count as a stat modifier.  If either ability is disabled by gastro acid, both lose their effect.",
        shortEffect: "Increases Special Attack to 1.5× when a friendly Pokémon has plus or minus.",
        flavorText: "Boosts the Sp. Atk stat of the Pokémon if an ally with the Plus or Minus Ability is also in battle."
    },
    [Abilities.FORECAST]: {
        effect: "During rain, strong sunlight, or hail, this Pokémon's type changes to water, fire, or ice, respectively, and its form changes to match.  This ability has no effect for any Pokémon other than castform.  If the weather ends or becomes anything that does not trigger this ability, or a Pokémon with air lock or cloud nine enters battle, this Pokémon's type and form revert to their default.  If this ability is lost or disabled, this Pokémon cannot change its current type and form until it regains its ability.",
        shortEffect: "Changes castform's type and form to match the weather.",
        flavorText: "The Pokémon transforms with the weather to change its type to Water, Fire, or Ice."
    },
    [Abilities.STICKY_HOLD]: {
        effect: "This Pokémon's hold item cannot be removed by other Pokémon.  Damaging moves that would remove this Pokémon's item can still inflict damage against this Pokémon, e.g. knock off or pluck.  This Pokémon can still use moves that involve the loss of its own item, e.g. fling or trick.  Overworld: If the lead Pokémon has this ability, the encounter rate while fishing is increased.",
        shortEffect: "Prevents a held item from being removed by other Pokémon.",
        flavorText: "The Pokémon's held items cling to its sticky body and cannot be removed by other Pokémon."
    },
    [Abilities.SHED_SKIN]: {
        effect: "After each turn, this Pokémon has a 33% of being cured of any major status ailment.",
        shortEffect: "Has a 33% chance of curing any major status ailment after each turn.",
        flavorText: "The Pokémon may cure its own status conditions by shedding its skin."
    },
    [Abilities.GUTS]: {
        effect: "Whenever this Pokémon is asleep, burned, paralyzed, or poisoned, it has 1.5× its Attack.  This Pokémon is not affected by the usual Attack cut from a burn.  This bonus does not count as a stat modifier.",
        shortEffect: "Increases Attack to 1.5× with a major status ailment.",
        flavorText: "It's so gutsy that having a status condition boosts the Pokémon's Attack stat."
    },
    [Abilities.MARVEL_SCALE]: {
        effect: "Whenever this Pokémon has a major status ailment, it has 1.5× its Defense.  This bonus does not count as a stat modifier.",
        shortEffect: "Increases Defense to 1.5× with a major status ailment.",
        flavorText: "The Pokémon's marvelous scales boost its Defense stat if it has a status condition."
    },
    [Abilities.LIQUID_OOZE]: {
        effect: "Whenever a Pokémon would heal after hitting this Pokémon with a leeching move like absorb, it instead loses as many HP as it would usually gain.  dream eater is unaffected.",
        shortEffect: "Damages opponents using leeching moves for as much as they would heal.",
        flavorText: "The strong stench of the Pokémon's oozed liquid damages attackers that use HP-draining moves."
    },
    [Abilities.OVERGROW]: {
        effect: "When this Pokémon has 1/3 or less of its HP remaining, its grass-type moves inflict 1.5× as much regular damage.",
        shortEffect: "Strengthens grass moves to inflict 1.5× damage at 1/3 max HP or less.",
        flavorText: "Powers up Grass-type moves when the Pokémon's HP is low."
    },
    [Abilities.BLAZE]: {
        effect: "When this Pokémon has 1/3 or less of its HP remaining, its fire-type moves inflict 1.5× as much regular damage.",
        shortEffect: "Strengthens fire moves to inflict 1.5× damage at 1/3 max HP or less.",
        flavorText: "Powers up Fire-type moves when the Pokémon's HP is low."
    },
    [Abilities.TORRENT]: {
        effect: "When this Pokémon has 1/3 or less of its HP remaining, its water-type moves inflict 1.5× as much regular damage.",
        shortEffect: "Strengthens water moves to inflict 1.5× damage at 1/3 max HP or less.",
        flavorText: "Powers up Water-type moves when the Pokémon's HP is low."
    },
    [Abilities.SWARM]: {
        effect: "When this Pokémon has 1/3 or less of its HP remaining, its bug-type moves inflict 1.5× as much regular damage.  Overworld: If the lead Pokémon has this ability, the wild encounter rate is increased.",
        shortEffect: "Strengthens bug moves to inflict 1.5× damage at 1/3 max HP or less.",
        flavorText: "Powers up Bug-type moves when the Pokémon's HP is low."
    },
    [Abilities.ROCK_HEAD]: {
        effect: "This Pokémon does not receive recoil damage from its recoil moves.  struggle's recoil is unaffected.  This ability does not prevent crash damage from missing with jump kick or high jump kick.",
        shortEffect: "Protects against recoil damage.",
        flavorText: "Protects the Pokémon from recoil damage."
    },
    [Abilities.DROUGHT]: {
        effect: "The weather changes to strong sunlight when this Pokémon enters battle and does not end unless cancelled by another weather condition.  If multiple Pokémon with this ability, drizzle, sand stream, or snow warning are sent out at the same time, the abilities will activate in order of Speed, respecting trick room.  Each ability's weather will cancel the previous weather, and only the weather summoned by the slowest of the Pokémon will stay.",
        shortEffect: "Summons strong sunlight that lasts indefinitely upon entering battle.",
        flavorText: "Turns the sunlight harsh when the Pokémon enters a battle."
    },
    [Abilities.ARENA_TRAP]: {
        effect: "While this Pokémon is in battle, opposing Pokémon cannot flee or switch out.  flying-type Pokémon and Pokémon in the air, e.g. due to levitate or magnet rise, are unaffected.  Pokémon with run away can still flee.  Pokémon can still switch out with the use of a move or item.  Overworld: If the lead Pokémon has this ability, the wild encounter rate is doubled.",
        shortEffect: "Prevents opponents from fleeing or switching out.  Eluded by flying-types and Pokémon in the air.",
        flavorText: "Prevents opposing Pokémon from fleeing from battle."
    },
    [Abilities.VITAL_SPIRIT]: {
        effect: "This Pokémon cannot be asleep.  This causes rest to fail altogether.  If a Pokémon is asleep and acquires this ability, it will immediately wake up; this includes when regaining a lost ability upon leaving battle.  This ability functions identically to insomnia in battle.  Overworld: If the lead Pokémon has this ability, higher-levelled Pokémon have their encounter rate increased.",
        shortEffect: "Prevents sleep.",
        flavorText: "The Pokémon is full of vitality, and that prevents it from falling asleep."
    },
    [Abilities.WHITE_SMOKE]: {
        effect: "This Pokémon cannot have its stats lowered by other Pokémon.  This ability does not prevent any stat losses other than stat modifiers, such as the Speed cut from paralysis; nor self-inflicted stat drops, such as the Special Attack drop from overheat; nor opponent-triggered stat boosts, such as the Attack boost from swagger.  This Pokémon can still be passed negative stat modifiers through guard swap, heart swap, or power swap.  This ability functions identically to clear body in battle.  Overworld: If the lead Pokémon has this ability, the wild encounter rate is halved.",
        shortEffect: "Prevents stats from being lowered by other Pokémon.",
        flavorText: "The Pokémon is protected by its white smoke, which prevents other Pokémon from lowering its stats."
    },
    [Abilities.PURE_POWER]: {
        effect: "This Pokémon's Attack is doubled in battle.  This bonus does not count as a stat modifier.  This ability functions identically to huge power.",
        shortEffect: "Doubles Attack in battle.",
        flavorText: "Using its pure power, the Pokémon doubles its Attack stat."
    },
    [Abilities.SHELL_ARMOR]: {
        effect: "Moves cannot score critical hits against this Pokémon.  This ability functions identically to battle armor.",
        shortEffect: "Protects against critical hits.",
        flavorText: "A hard shell protects the Pokémon from critical hits."
    },
    [Abilities.AIR_LOCK]: {
        effect: "While this Pokémon is in battle, weather can still be in play, but will not have any of its effects.  This ability functions identically to cloud nine.",
        shortEffect: "Negates all effects of weather, but does not prevent the weather itself.",
        flavorText: "Eliminates the effects of weather."
    },
    [Abilities.TANGLED_FEET]: {
        effect: "When this Pokémon is confused, it has twice its evasion.",
        shortEffect: "Doubles evasion when confused.",
        flavorText: "Boosts the Pokémon's evasiveness if it is confused."
    },
    [Abilities.MOTOR_DRIVE]: {
        effect: "Whenever an electric-type move hits this Pokémon, its Speed rises one stage, negating any other effect on it.  This ability will not take effect if this Pokémon is immune to Electric moves.  Electric moves will ignore this Pokémon's substitute.  This effect includes non-damaging moves, i.e. thunder wave.",
        shortEffect: "Absorbs electric moves, raising Speed one stage.",
        flavorText: "The Pokémon takes no damage when hit by Electric-type moves. Instead, its Speed stat is boosted."
    },
    [Abilities.RIVALRY]: {
        effect: "This Pokémon inflicts 1.25× as much regular damage against Pokémon of the same gender and 0.75× as much regular damage against Pokémon of the opposite gender.  If either Pokémon is genderless, damage is unaffected.",
        shortEffect: "Increases damage inflicted to 1.25× against Pokémon of the same gender, but decreases damage to 0.75× against the opposite gender.",
        flavorText: "The Pokémon's competitive spirit makes it deal more damage to Pokémon of the same gender, but less damage to Pokémon of the opposite gender."
    },
    [Abilities.STEADFAST]: {
        effect: "Whenever this Pokémon flinches, its Speed rises one stage.",
        shortEffect: "Raises Speed one stage upon flinching.",
        flavorText: "The Pokémon's determination boosts its Speed stat every time it flinches."
    },
    [Abilities.SNOW_CLOAK]: {
        effect: "During hail, this Pokémon has 1.25× its evasion, and it does not take hail damage regardless of type.  The evasion bonus does not count as a stat modifier.  Overworld: If the lead Pokémon has this ability, the wild encounter rate is halved in snow.",
        shortEffect: "Increases evasion to 1.25× during hail.  Protects against hail damage.",
        flavorText: "Boosts the Pokémon's evasiveness in snow."
    },
    [Abilities.GLUTTONY]: {
        effect: "This Pokémon eats any held Berry triggered by low HP when it falls below 50% of its HP, regardless of the Berry's usual threshold.",
        shortEffect: "Makes the Pokémon eat any held Berry triggered by low HP below 1/2 its max HP.",
        flavorText: "If the Pokémon is holding a Berry to be eaten when its HP is low, it will instead eat the Berry when its HP drops to half or less."
    },
    [Abilities.ANGER_POINT]: {
        effect: "Whenever this Pokémon receives a critical hit, its Attack rises to the maximum of 6 stages.  This ability will still take effect if the critical hit is received by a substitute.",
        shortEffect: "Raises Attack to the maximum of six stages upon receiving a critical hit.",
        flavorText: "The Pokémon is angered when it takes a critical hit, and that maxes its Attack stat."
    },
    [Abilities.UNBURDEN]: {
        effect: "When this Pokémon uses or loses its held item, its Speed is doubled.  If it gains another item or leaves battle, this bonus is lost.  This includes when the Pokémon drops its item because of knock off.  This bonus does not count as a stat modifier.  There is no notification when this ability takes effect.",
        shortEffect: "Doubles Speed upon using or losing a held item.",
        flavorText: "Boosts the Speed stat if the Pokémon's held item is used or lost."
    },
    [Abilities.HEATPROOF]: {
        effect: "This Pokémon takes half as much damage from fire-type moves and burns.",
        shortEffect: "Halves damage from fire moves and burns.",
        flavorText: "The Pokémon's heatproof body halves the damage taken from Fire-type moves."
    },
    [Abilities.SIMPLE]: {
        effect: "Each stage of this Pokémon's stat modifiers acts as two stages.  These doubled stages are still limited to a minimum of -6 and a maximum of 6.  This Pokémon can still accumulate less than -3 or more than 3 stages of stat modifiers, even though the extra ones have no effect after doubling.",
        shortEffect: "Doubles the Pokémon's stat modifiers.  These doubled modifiers are still capped at -6 or 6 stages.",
        flavorText: "Doubles the effects of the Pokémon's stat changes."
    },
    [Abilities.DRY_SKIN]: {
        effect: "This Pokémon takes 1/8 of its maximum HP in damage after each turn during strong sunlight, but it heals for 1/8 of its HP each turn during rain.  This Pokémon takes 1.25× as much damage from fire-type moves, but whenever a water move hits it, it heals for 1/4 its maximum HP instead.",
        shortEffect: "Causes 1/8 max HP in damage each turn during strong sunlight, but heals for 1/8 max HP during rain.  Increases damage from fire moves to 1.25×, but absorbs water moves, healing for 1/4 max HP.",
        flavorText: "Restores the Pokémon's HP in rain or when it is hit by Water-type moves. Reduces HP in harsh sunlight, and increases the damage received from Fire-type moves."
    },
    [Abilities.DOWNLOAD]: {
        effect: "When this Pokémon enters battle, its Attack or Special Attack, whichever corresponds to its opponents' weaker total defensive stat, rises one stage.  In the event of a tie, Special Attack is raised.  This ability also takes effect when acquired during a battle.",
        shortEffect: "Raises the attack stat corresponding to the opponents' weaker defense one stage upon entering battle.",
        flavorText: "The Pokémon compares an opposing Pokémon's Defense and Sp. Def stats before raising its own Attack or Sp. Atk stat—whichever will be more effective."
    },
    [Abilities.IRON_FIST]: {
        effect: "Moves flagged as being punch-based have 1.2× their base power for this Pokémon.  sucker punch is not flagged as punch-based; its original, Japanese name only means 'surprise attack'.",
        shortEffect: "Strengthens punch-based moves to 1.2× their power.",
        flavorText: "Powers up punching moves."
    },
    [Abilities.POISON_HEAL]: {
        effect: "If this Pokémon is poisoned, it will heal for 1/8 of its maximum HP after each turn rather than taking damage.  This includes bad poison.",
        shortEffect: "Heals for 1/8 max HP after each turn when poisoned in place of damage.",
        flavorText: "If poisoned, the Pokémon has its HP restored instead of taking damage."
    },
    [Abilities.ADAPTABILITY]: {
        effect: "This Pokémon inflicts twice as much damage with moves whose types match its own, rather than the usual same-type attack bonus of 1.5×.",
        shortEffect: "Increases the same-type attack bonus from 1.5× to 2×.",
        flavorText: "Powers up moves of the same type as the Pokémon."
    },
    [Abilities.SKILL_LINK]: {
        effect: "This Pokémon always hits five times with two-to-five-hit moves, such as icicle spear.  It also bypasses the accuracy checks on triple kick's second and third hits.",
        shortEffect: "Extends two-to-five-hit moves and triple kick to their full length every time.",
        flavorText: "Maximizes the number of times multistrike moves hit."
    },
    [Abilities.HYDRATION]: {
        effect: "This Pokémon is cured of any major status ailment after each turn during rain.",
        shortEffect: "Cures any major status ailment after each turn during rain.",
        flavorText: "Cures the Pokémon's status conditions in rain."
    },
    [Abilities.SOLAR_POWER]: {
        effect: "During strong sunlight, this Pokémon has 1.5× its Special Attack but takes 1/8 of its maximum HP in damage after each turn.",
        shortEffect: "Increases Special Attack to 1.5× but costs 1/8 max HP after each turn during strong sunlight.",
        flavorText: "In harsh sunlight, the Pokémon's Sp. Atk stat is boosted, but its HP decreases every turn."
    },
    [Abilities.QUICK_FEET]: {
        effect: "Whenever this Pokémon has a major status ailment, it has 1.5× its Speed.  This Pokémon is not affected by the usual Speed cut from paralysis.  Overworld: If the lead Pokémon has this ability, the wild encounter rate is halved.",
        shortEffect: "Increases Speed to 1.5× with a major status ailment.",
        flavorText: "Boosts the Speed stat if the Pokémon has a status condition."
    },
    [Abilities.NORMALIZE]: {
        effect: "This Pokémon's moves all act as if they were normal-type.  Moves that inflict typeless damage do so as usual.  Moves of variable type, such as hidden power, are affected.  They otherwise work as usual, however; weather ball, for example, is always forced to be Normal, but it still has doubled power and looks different during weather.  As thunder wave is prevented by immunities, unlike most non-damaging moves, it does not affect ghost-type Pokémon under the effect of this ability.",
        shortEffect: "Makes the Pokémon's moves all act normal-type.",
        flavorText: "All the Pokémon’s moves become Normal type. The power of those moves is boosted a little."
    },
    [Abilities.SNIPER]: {
        effect: "This Pokémon inflicts triple damage with critical hits, rather than the usual double damage.",
        shortEffect: "Strengthens critical hits to inflict 3× damage rather than 2×.",
        flavorText: "If the Pokémon's attack lands a critical hit, the attack is powered up even further."
    },
    [Abilities.MAGIC_GUARD]: {
        effect: "This Pokémon is immune to damage not directly caused by a move.  For example, this Pokémon takes no damage from from weather, recoil, status ailments, or spikes, but it still suffers from the Attack cut when burned, and a life orb will still power up this Pokémon's moves without damaging it.  Anything that directly depends on such damage will also not happen; for example, leech seed will neither hurt this Pokémon nor heal the opponent, and Pokémon with a jaboca berry or rowap berry will not consume the berry when hit by this Pokémon.  The following are unaffected: struggle, pain split (whether used by or against this Pokémon), belly drum, substitute, curse, moves that knock the user out, and damage from confusion.  This Pokémon will neither lose nor regain HP if it drains HP from a Pokémon with liquid ooze.  If this Pokémon is badly poisoned, the poison counter is still increased each turn; if the Pokémon loses this ability, it will begin taking as much damage as it would be if it had been taking increasing damage each turn.",
        shortEffect: "Protects against damage not directly caused by a move.",
        flavorText: "The Pokémon only takes damage from attacks."
    },
    [Abilities.NO_GUARD]: {
        effect: "Moves used by or against this Pokémon never miss.  One-hit KO moves are unaffected.  Moves affected by this ability can hit Pokémon during the preparation turn of moves like dig or fly.  Overworld: If the lead Pokémon has this ability, the wild encounter rate is doubled.",
        shortEffect: "Ensures all moves used by and against the Pokémon hit.",
        flavorText: "The Pokémon employs no-guard tactics to ensure incoming and outgoing attacks always land. "
    },
    [Abilities.STALL]: {
        effect: "This Pokémon moves last within its priority bracket.  Multiple Pokémon with this ability move in order of Speed amongst themselves.  The full incense and lagging tail take precedence over this ability; that is, Pokémon with these items move after Pokémon with this ability.  Pokémon with both this ability and one of these items are delayed as much as if they had only the item.  This ability works as usual during trick room: Pokémon with this ability will move in reverse order of Speed after Pokémon without it.",
        shortEffect: "Makes the Pokémon move last within its move's priority bracket.",
        flavorText: "The Pokémon is always the last to use its moves. "
    },
    [Abilities.TECHNICIAN]: {
        effect: "This Pokémon's moves have 1.5× their power if their base power is 60 or less.  This includes moves of variable power, such as hidden power and magnitude, when their power is 60 or less.  helping hand's power boost is taken into account for any move, as is defense curl's power boost for rollout.",
        shortEffect: "Strengthens moves of 60 base power or less to 1.5× their power.",
        flavorText: "Powers up weak moves so the Pokémon can deal more damage with them."
    },
    [Abilities.LEAF_GUARD]: {
        effect: "This Pokémon cannot be given a major status ailment during strong sunlight.  This ability does not heal prior status ailments.  rest will fail altogether with this ability in effect.  yawn will immediately fail if used on this Pokémon during strong sunlight, and an already-used Yawn will fail if the weather turns to strong sunlight in the meantime.",
        shortEffect: "Protects against major status ailments during strong sunlight.",
        flavorText: "Prevents status conditions in harsh sunlight."
    },
    [Abilities.KLUTZ]: {
        effect: "In battle, this Pokémon cannot use its held item, nor will the item have any passive effect on the battle, positive or negative.  This Pokémon also cannot use fling.  The Speed cut from the iron ball and the effort items (the macho brace, power weight, power bracer, power belt, power lens, power band, and power anklet) is unaffected.  Items that do not directly affect the battle, such as the exp share, the amulet coin, or the soothe bell, work as usual.  All held items work as usual out of battle.  Other moves that use the held item, such as natural gift and switcheroo, work as usual.",
        shortEffect: "Prevents the Pokémon from using its held item in battle.",
        flavorText: "The Pokémon can't use any held items."
    },
    [Abilities.MOLD_BREAKER]: {
        effect: "This Pokémon's moves completely ignore abilities that could hinder or prevent their effect on the target.  For example, this Pokémon's moves ignore abilities that would fully negate them, such as water absorb; abilities that would prevent any of their effects, such as clear body, shell armor, or sticky hold; and abilities that grant any general protective benefit, such as simple, snow cloak, or thick fat.  If an ability could either hinder or help this Pokémon's moves, e.g. dry skin or unaware, the ability is ignored either way.  Abilities that do not fit this description, even if they could hinder moves in some other way, are not affected.  For example, cursed body only affects potential future uses of the move, while liquid ooze and shadow tag can only hinder a move's effect on the user.  This ablity cannot ignore type or form changes granted by abilities, for example color change or forecast; nor effects that were caused by abilities but are no longer tied to an ability, such as the rain from drizzle.  This ability cannot ignore multitype at all.  An ability ignored by this ability is only nullified while the move is being used.  For example, this Pokémon's moves can paralyze a Pokémon with limber, but Limber will activate and heal the paralysis immediately thereafter, and this Pokémon's spikes are not affected by this ability after they have been placed.  When this Pokémon enters battle, all participating trainers are notified that it has this ability.  This ability functions identically to teravolt and turboblaze.",
        shortEffect: "Bypasses targets' abilities if they could hinder or prevent a move.",
        flavorText: "The Pokémon's moves are unimpeded by the Ability of the target."
    },
    [Abilities.SUPER_LUCK]: {
        effect: "This Pokémon's moves have critical hit rates one stage higher than normal.",
        shortEffect: "Raises moves' critical hit rates one stage.",
        flavorText: "The Pokémon is so lucky that the critical-hit ratios of its moves are boosted."
    },
    [Abilities.AFTERMATH]: {
        effect: "When this Pokémon is knocked out by a move that makes contact, the move's user takes 1/4 its maximum HP in damage.",
        shortEffect: "Damages the attacker for 1/4 its max HP when knocked out by a contact move.",
        flavorText: "Damages the attacker if it knocks out the Pokémon with a move that makes direct contact."
    },
    [Abilities.ANTICIPATION]: {
        effect: "When this Pokémon enters battle, if one of its opponents has a move that is super effective against it, self destruct, explosion, or a one-hit knockout move, all participating trainers are notified.  The move itself is not revealed; only that there is such a move.  Moves that inflict typeless damage, such as future sight, and moves of variable type, such as hidden power, count as their listed types.  counter, metal burst, mirror coat, and one-hit KO moves to which this Pokémon is immune do not trigger this ability.",
        shortEffect: "Notifies all trainers upon entering battle if an opponent has a super-effective move, self destruct, explosion, or a one-hit KO move.",
        flavorText: "The Pokémon can sense an opposing Pokémon's dangerous moves."
    },
    [Abilities.FOREWARN]: {
        effect: "When this Pokémon enters battle, it reveals the move with the highest base power known by any opposing Pokémon to all participating trainers.  In the event of a tie, one is chosen at random.  Moves without a listed base power are assigned one as follows:  Power | Moves ----: | -----   160 | One-hit KO moves: fissure, guillotine, horn drill, and sheer cold   120 | Counter moves: counter, metal burst, and mirror coat    80 | Variable power or set damage: crush grip, dragon rage, electro ball, endeavor, final gambit, flail, frustration, grass knot, gyro ball, heat crash, heavy slam, hidden power, low kick, natural gift, night shade, psywave, return, reversal, seismic toss, sonic boom, trump card, and wring out     0 | Any such move not listed ",
        shortEffect: "Reveals the opponents' strongest move upon entering battle.",
        flavorText: "When it enters a battle, the Pokémon can tell one of the moves an opposing Pokémon has."
    },
    [Abilities.UNAWARE]: {
        effect: "This Pokémon ignores other Pokémon's stat modifiers for the purposes of damage and accuracy calculation.  Effectively, this affects modifiers of every stat except Speed.  The power of punishment and stored power is calculated as usual.  When this Pokémon hurts itself in confusion, its stat modifiers affect damage as usual.",
        shortEffect: "Ignores other Pokémon's stat modifiers for damage and accuracy calculation.",
        flavorText: "When attacking, the Pokémon ignores the target's stat changes."
    },
    [Abilities.TINTED_LENS]: {
        effect: "This Pokémon deals twice as much damage with moves that are not very effective against the target.",
        shortEffect: "Doubles damage inflicted with not-very-effective moves.",
        flavorText: "The Pokémon can use “not very effective” moves to deal regular damage."
    },
    [Abilities.FILTER]: {
        effect: "This Pokémon takes 0.75× as much damage from moves that are super effective against it.  This ability functions identically to solid rock.",
        shortEffect: "Decreases damage taken from super-effective moves by 1/4.",
        flavorText: "Reduces the power of supereffective attacks that hit the Pokémon."
    },
    [Abilities.SLOW_START]: {
        effect: "This Pokémon's Attack and Speed are halved for five turns upon entering battle.  This ability also takes effect when acquired during battle.  If this Pokémon loses its ability before the five turns are up, its Attack and Speed return to normal; if it then regains this ability without leaving battle, its Attack and Speed are halved again, but the counter keeps counting from where it was.",
        shortEffect: "Halves Attack and Speed for five turns upon entering battle.",
        flavorText: "For five turns, the Pokémon's Attack and Speed stats are halved."
    },
    [Abilities.SCRAPPY]: {
        effect: "This Pokémon ignores ghost-type Pokémon's immunity to normal- and fighting-type moves.  Ghost Pokémon's other types affect damage as usual.",
        shortEffect: "Lets the Pokémon's normal and fighting moves hit ghost Pokémon.",
        flavorText: "The Pokémon can hit Ghost-type Pokémon with Normal- and Fighting-type moves. It is also unaffected by Intimidate."
    },
    [Abilities.STORM_DRAIN]: {
        effect: "All other Pokémon's single-target water-type moves are redirected to this Pokémon, if it is an eligible target.  Other Pokémon's Water moves raise this Pokémon's Special Attack one stage, negating any other effect on it, and cannot miss it.  If the move's intended target also has this ability, the move is not redirected.  When multiple Pokémon with this ability are possible targets for redirection, the move is redirected to the one with the highest Speed stat, or, in the case of a tie, to a random tied Pokémon.  follow me takes precedence over this ability.",
        shortEffect: "Redirects single-target water moves to this Pokémon where possible.  Absorbs Water moves, raising Special Attack one stage.",
        flavorText: "The Pokémon draws in all Water-type moves. Instead of taking damage from them, its Sp. Atk stat is boosted."
    },
    [Abilities.ICE_BODY]: {
        effect: "This Pokémon heals for 1/16 of its maximum HP after each turn during hail, and it does not take hail damage regardless of type.",
        shortEffect: "Heals for 1/16 max HP after each turn during hail.  Protects against hail damage.",
        flavorText: "The Pokémon gradually regains HP in snow."
    },
    [Abilities.SOLID_ROCK]: {
        effect: "This Pokémon takes 0.75× as much damage from moves that are super effective against it.  This ability functions identically to filter.",
        shortEffect: "Decreases damage taken from super-effective moves by 1/4.",
        flavorText: "Reduces the power of supereffective attacks that hit the Pokémon."
    },
    [Abilities.SNOW_WARNING]: {
        effect: "The weather changes to hail when this Pokémon enters battle and does not end unless cancelled by another weather condition.  If multiple Pokémon with this ability, drizzle, drought, or sand stream are sent out at the same time, the abilities will activate in order of Speed, respecting trick room.  Each ability's weather will cancel the previous weather, and only the weather summoned by the slowest of the Pokémon will stay.",
        shortEffect: "Summons hail that lasts indefinitely upon entering battle.",
        flavorText: "The Pokémon makes it snow when it enters a battle."
    },
    [Abilities.HONEY_GATHER]: {
        effect: "This Pokémon has a chance of picking up honey after each battle.  This chance starts at 5% and rises another 5% after every tenth level: 5% from level 1–10, 10% from 11–20, and so on, up to 50% from 91–100.  This ability is checked after the battle ends, at which point any temporary ability changes have worn off.",
        shortEffect: "The Pokémon may pick up honey after battle.",
        flavorText: "The Pokémon may gather Honey after a battle."
    },
    [Abilities.FRISK]: {
        effect: "When this Pokémon enters battle, it reveals an opposing Pokémon's held item to all participating trainers.  In a double battle, if one opponent has an item, this Pokémon will Frisk that Pokémon; if both have an item, it will Frisk one at random.",
        shortEffect: "Reveals an opponent's held item upon entering battle.",
        flavorText: "When it enters a battle, the Pokémon can check an opposing Pokémon's held item."
    },
    [Abilities.RECKLESS]: {
        effect: "This Pokémon's recoil moves and crash moves have 1.2× their base power.  struggle is unaffected.  The 'crash moves' are the moves that damage the user upon missing: jump kick and high jump kick.",
        shortEffect: "Strengthens recoil moves to 1.2× their power.",
        flavorText: "Powers up moves that have recoil damage."
    },
    [Abilities.MULTITYPE]: {
        effect: "If this Pokémon is holding an elemental Plate, its type and form change to match the Plate.  This Pokémon's held item, whether or not it is a Plate, cannot be taken by covet or thief, nor removed by knock off, nor traded by switcheroo or trick.  Covet, Thief, and Knock Off still inflict damage against this Pokémon.  Unlike with sticky hold, this Pokémon cannot use fling, Switcheroo, or Trick to lose its item itself, nor gain an item through Switcheroo or Trick if it does not have one.  This ability has no effect for any Pokémon other than arceus.  This ability cannot be traded with skill swap, nor copied with role play or trace, nor disabled with gastro acid, nor changed with worry seed.  This Pokémon cannot use Skill Swap or Role Play to lose its ability itself.  mold breaker cannot ignore this ability.  If a Pokémon Transforms into an Arceus with this ability, it will Transform into Arceus's default, normal-type form.  If the Transforming Pokémon is holding a Plate, this ability will then activate and change the Pokémon into the corresponding form.",
        shortEffect: "Changes arceus's type and form to match its held Plate.",
        flavorText: "Changes the Pokémon's type to match the plate it holds. "
    },
    [Abilities.FLOWER_GIFT]: {
        effect: "Friendly Pokémon have 1.5× their Attack and Special Defense during strong sunlight if any friendly Pokémon has this ability.  Unlike forecast, multitype, and zen mode, this ability is not tied to its Pokémon's form change; cherrim will switch between its forms even if it loses this ability.  As such, this ability also works if obtained by a Pokémon other than Cherrim.",
        shortEffect: "Increases friendly Pokémon's Attack and Special Defense to 1.5× during strong sunlight.",
        flavorText: "Boosts the Attack and Sp. Def stats of itself and allies in harsh sunlight."
    },
    [Abilities.BAD_DREAMS]: {
        effect: "Opposing Pokémon take 1/8 of their maximum HP in damage after each turn while they are asleep.",
        shortEffect: "Damages sleeping opponents for 1/8 their max HP after each turn.",
        flavorText: "Damages opposing Pokémon that are asleep."
    },
    [Abilities.PICKPOCKET]: {
        effect: "Whenever a move makes contact with this Pokémon, if it does not have a held item, it steals the attacker's held item.  This Pokémon cannot steal upon being knocked out.  It can steal if the attacker has a substitute, but cannot steal when its own Substitute is hit.  If a move hits multiple times, only the last hit triggers this ability.  If this Pokémon is wild, it cannot steal from a trained Pokémon.",
        shortEffect: "Steals attacking Pokémon's held items on contact.",
        flavorText: "The Pokémon steals the held item from attackers that made direct contact with it."
    },
    [Abilities.SHEER_FORCE]: {
        effect: "This Pokémon's moves with extra effects have 1.3× their power, but lose their extra effects.  An effect chance is a move's chance to inflict a status ailment, cause a stat change, or make the target flinch in addition to the move's main effect. For example, thunder shock's paralysis is an extra effect, but thunder wave's is not, nor are knock off's item removal and air cutter's increased critical hit rate.  Moves that lower the user's stats are unaffected.",
        shortEffect: "Strengthens moves with extra effects to 1.3× their power, but prevents their extra effects.",
        flavorText: "Removes any additional effects from the Pokémon's moves, but increases the moves' power."
    },
    [Abilities.CONTRARY]: {
        effect: "Whenever this Pokémon's stats would be raised, they are instead lowered by the same amount, and vice versa.",
        shortEffect: "Inverts stat changes.",
        flavorText: "Reverses any stat changes affecting the Pokémon so that attempts to boost its stats instead lower them—and attempts to lower its stats will boost them."
    },
    [Abilities.UNNERVE]: {
        effect: "Opposing Pokémon cannot eat held Berries while this Pokémon is in battle.  Affected Pokémon can still use bug bite or pluck to eat a target's Berry.",
        shortEffect: "Prevents opposing Pokémon from eating held Berries.",
        flavorText: "Unnerves opposing Pokémon and makes them unable to eat Berries."
    },
    [Abilities.DEFIANT]: {
        effect: "When any of this Pokémon's stats are lowered, its Attack rises by two stages.  If multiple stats are lowered at once, this ability takes effect with each stat lowered.",
        shortEffect: "Raises Attack two stages upon having any stat lowered.",
        flavorText: "If the Pokémon has any stat lowered by an opposing Pokémon, its Attack stat will be boosted sharply."
    },
    [Abilities.DEFEATIST]: {
        effect: "This Pokémon's Attack and Special Attack are halved when it has half its HP or less.",
        shortEffect: "Halves Attack and Special Attack at 50% max HP or less.",
        flavorText: "Halves the Pokémon’s Attack and Sp. Atk stats when its HP becomes half or less."
    },
    [Abilities.CURSED_BODY]: {
        effect: "Moves that hit this Pokémon have a 30% chance of being Disabled afterward.",
        shortEffect: "Has a 30% chance of Disabling any move that hits the Pokémon.",
        flavorText: "May disable a move that has dealt damage to the Pokémon."
    },
    [Abilities.HEALER]: {
        effect: "Friendly Pokémon next to this Pokémon in double and triple battles each have a 30% chance of being cured of any major status ailment after each turn.",
        shortEffect: "Has a 30% chance of curing each adjacent ally of any major status ailment after each turn.",
        flavorText: "Sometimes cures the status conditions of the Pokémon's allies."
    },
    [Abilities.FRIEND_GUARD]: {
        effect: "All friendly Pokémon take 0.75× as much direct damage from moves while this Pokémon is in battle.  This effect stacks if multiple allied Pokémon have it.",
        shortEffect: "Decreases all direct damage taken by friendly Pokémon to 0.75×.",
        flavorText: "Reduces damage dealt to allies."
    },
    [Abilities.WEAK_ARMOR]: {
        effect: "Whenever a physical move hits this Pokémon, its Speed rises one stage and its Defense falls one stage.  This ability triggers on every hit of a multiple-hit move.",
        shortEffect: "Raises Speed and lowers Defense by one stage each upon being hit by a physical move.",
        flavorText: "The Pokémon's Defense stat is lowered when it takes damage from physical moves, but its Speed stat is sharply boosted."
    },
    [Abilities.HEAVY_METAL]: {
        effect: "This Pokémon has double the usual weight for its species.",
        shortEffect: "Doubles the Pokémon's weight.",
        flavorText: "Doubles the Pokémon's weight."
    },
    [Abilities.LIGHT_METAL]: {
        effect: "This Pokémon has half the usual weight for its species.",
        shortEffect: "Halves the Pokémon's weight.",
        flavorText: "Halves the Pokémon's weight."
    },
    [Abilities.MULTISCALE]: {
        effect: "This Pokémon takes half as much damage when it is hit having full HP.",
        shortEffect: "Halves damage taken from full HP.",
        flavorText: "Reduces the amount of damage the Pokémon takes while its HP is full."
    },
    [Abilities.TOXIC_BOOST]: {
        effect: "This Pokémon has 1.5× its Attack when poisoned.",
        shortEffect: "Increases Attack to 1.5× when poisoned.",
        flavorText: "Powers up physical moves when the Pokémon is poisoned."
    },
    [Abilities.FLARE_BOOST]: {
        effect: "This Pokémon has 1.5× its Special Attack when burned.",
        shortEffect: "Increases Special Attack to 1.5× when burned.",
        flavorText: "Powers up special moves when the Pokémon is burned."
    },
    [Abilities.HARVEST]: {
        effect: "After each turn, if the last item this Pokémon consumed was a Berry and it is not currently holding an item, it has a 50% chance of regaining that Berry, or a 100% chance during strong sunlight.",
        shortEffect: "Has a 50% chance of restoring a used Berry after each turn if the Pokémon has held no items in the meantime.",
        flavorText: "May create another Berry after one is used."
    },
    [Abilities.TELEPATHY]: {
        effect: "This Pokémon does not take damage from friendly Pokémon's moves, including single-target moves aimed at it.",
        shortEffect: "Protects against friendly Pokémon's damaging moves.",
        flavorText: "The Pokémon anticipates and dodges the attacks of its allies."
    },
    [Abilities.MOODY]: {
        effect: "After each turn, one of this Pokémon's stats at random rises two stages, and another falls one stage.  If a stat is already at 6 or -6 stages, it will not be chosen to be increased or decreased, respectively.",
        shortEffect: "Raises a random stat two stages and lowers another one stage after each turn.",
        flavorText: "Every turn, one of the Pokémon's stats will be boosted sharply but another stat will be lowered."
    },
    [Abilities.OVERCOAT]: {
        effect: "This Pokémon does not take damage from weather.",
        shortEffect: "Protects against damage from weather.",
        flavorText: "The Pokémon takes no damage from sandstorms. It is also protected from the effects of powders and spores."
    },
    [Abilities.POISON_TOUCH]: {
        effect: "This Pokémon's contact moves have a 30% chance of poisoning the target with each hit.  This counts as an extra effect for the purposes of shield dust.  This ability takes effect before mummy.",
        shortEffect: "Has a 30% chance of poisoning target Pokémon upon contact.",
        flavorText: "May poison a target when the Pokémon makes contact."
    },
    [Abilities.REGENERATOR]: {
        effect: "This Pokémon regains 1/3 of its maximum HP when it is switched out for another Pokémon under any circumstances other than having fainted.  This ability does not take effect when a battle ends.",
        shortEffect: "Heals for 1/3 max HP upon switching out.",
        flavorText: "The Pokémon has a little of its HP restored when withdrawn from battle."
    },
    [Abilities.BIG_PECKS]: {
        effect: "This Pokémon's Defense cannot be lowered by other Pokémon.  This Pokémon can still be passed negative Defense modifiers through heart swap or guard swap.",
        shortEffect: "Protects against Defense drops.",
        flavorText: "Prevents the Pokémon from having its Defense stat lowered."
    },
    [Abilities.SAND_RUSH]: {
        effect: "This Pokémon's Speed is doubled during a sandstorm, and it does not take sandstorm damage, regardless of type.",
        shortEffect: "Doubles Speed during a sandstorm.  Protects against sandstorm damage.",
        flavorText: "Boosts the Pokémon's Speed stat in a sandstorm."
    },
    [Abilities.WONDER_SKIN]: {
        effect: "Non-damaging moves have exactly 50% base accuracy against this Pokémon.",
        shortEffect: "Lowers incoming non-damaging moves' base accuracy to exactly 50%.",
        flavorText: "Makes status moves more likely to miss the Pokémon."
    },
    [Abilities.ANALYTIC]: {
        effect: "This Pokémon's moves have 1.3× their power when it moves last in a turn.  future sight and doom desire are unaffected.",
        shortEffect: "Strengthens moves to 1.3× their power when moving last.",
        flavorText: "Boosts the power of the Pokémon's move if it is the last to act that turn."
    },
    [Abilities.ILLUSION]: {
        effect: "This Pokémon, upon being sent out, appears to have the species, nickname, and Poké Ball of the last Pokémon in the party that is able to battle.  This illusion breaks upon being hit by a damaging move.  Other damage, e.g. from weather or spikes, does not break the illusion, nor does damage done to a substitute.  If the party order becomes temporarily shuffled around as Pokémon are switched out in battle, this ability chooses the last Pokémon according to that shuffled order.",
        shortEffect: "Takes the appearance of the last conscious party Pokémon upon being sent out until hit by a damaging move.",
        flavorText: "The Pokémon fools opponents by entering battle disguised as the last Pokémon in its Trainer's party."
    },
    [Abilities.IMPOSTER]: {
        effect: "This Pokémon transforms into a random opponent upon entering battle.  This effect is identical to the move transform.",
        shortEffect: "Transforms upon entering battle.",
        flavorText: "The Pokémon transforms itself into the Pokémon it's facing."
    },
    [Abilities.INFILTRATOR]: {
        effect: "This Pokémon's moves ignore light screen, reflect, and safeguard.",
        shortEffect: "Bypasses light screen, reflect, and safeguard.",
        flavorText: "The Pokémon's moves are unaffected by the target's barriers, substitutes, and the like."
    },
    [Abilities.MUMMY]: {
        effect: "Whenever a contact move hits this Pokémon, the attacking Pokémon's ability changes to Mummy.  multitype is unaffected.  If a Pokémon with moxie knocks this Pokémon out, the former's ability will change without taking effect.",
        shortEffect: "Changes attacking Pokémon's abilities to Mummy on contact.",
        flavorText: "Contact with the Pokémon changes the attacker’s Ability to Mummy."
    },
    [Abilities.MOXIE]: {
        effect: "This Pokémon's Attack rises one stage upon knocking out another Pokémon, even a friendly Pokémon.  This ability does not take effect when the Pokémon indirectly causes another Pokémon to faint, e.g. through poison or spikes.  If this Pokémon knocks out a Pokémon with mummy, the former's ability will change without taking effect.",
        shortEffect: "Raises Attack one stage upon KOing a Pokémon.",
        flavorText: "When the Pokémon knocks out a target, it shows moxie, which boosts its Attack stat."
    },
    [Abilities.JUSTIFIED]: {
        effect: "Whenever a dark-type move hits this Pokémon, its Attack rises one stage.  The move is not negated in any way.",
        shortEffect: "Raises Attack one stage upon taking damage from a dark move.",
        flavorText: "When the Pokémon is hit by a Dark-type attack, its Attack stat is boosted by its sense of justice."
    },
    [Abilities.RATTLED]: {
        effect: "This Pokémon's Speed rises one stage with each hit from a damaging dark-, ghost-, or bug-type move.",
        shortEffect: "Raises Speed one stage upon being hit by a dark, ghost, or bug move.",
        flavorText: "The Pokémon gets scared when hit by a Dark-, Ghost-, or Bug-type attack or if intimidated, which boosts its Speed stat."
    },
    [Abilities.MAGIC_BOUNCE]: {
        effect: "When this Pokémon is targeted by a move flagged as being reflectable, the move is redirected to its user.  All reflectable moves are non-damaging, and most non-damaging moves that target other Pokémon are reflectable.  A move reflected by this ability or magic coat cannot be reflected back.",
        shortEffect: "Reflects most non-damaging moves back at their user.",
        flavorText: "The Pokémon reflects status moves instead of getting hit by them."
    },
    [Abilities.SAP_SIPPER]: {
        effect: "Whenever a grass-type move hits this Pokémon, its Attack rises one stage, negating any other effect on it.",
        shortEffect: "Absorbs grass moves, raising Attack one stage.",
        flavorText: "The Pokémon takes no damage when hit by Grass-type moves. Instead, its Attack stat is boosted."
    },
    [Abilities.PRANKSTER]: {
        effect: "This Pokémon's non-damaging moves have their priority increased by one stage.",
        shortEffect: "Raises non-damaging moves' priority by one stage.",
        flavorText: "Gives priority to the Pokémon's status moves."
    },
    [Abilities.SAND_FORCE]: {
        effect: "During a sandstorm, this Pokémon's rock-, ground-, and steel-type moves have 1.3× their base power.  This Pokémon does not take sandstorm damage, regardless of type.",
        shortEffect: "Strengthens rock, ground, and steel moves to 1.3× their power during a sandstorm.  Protects against sandstorm damage.",
        flavorText: "Boosts the power of Rock-, Ground-, and Steel-type moves in a sandstorm. "
    },
    [Abilities.IRON_BARBS]: {
        effect: "Whenever a move makes contact with this Pokémon, the move's user takes 1/8 of its maximum HP in damage.  This ability functions identically to rough skin.",
        shortEffect: "Damages attacking Pokémon for 1/8 their max HP on contact.",
        flavorText: "Inflicts damage on the attacker upon contact with iron barbs."
    },
    [Abilities.ZEN_MODE]: {
        effect: "This Pokémon switches between Standard Mode and Zen Mode after each turn depending on its HP.  Below 50% of its maximum HP, it switches to Zen Mode, and at 50% or above, it switches to Standard Mode.  This Pokémon returns to Standard Mode upon leaving battle or losing this ability.  This ability has no effect if this Pokémon is not a darmanitan.",
        shortEffect: "Changes darmanitan's form after each turn depending on its HP: Zen Mode below 50% max HP, and Standard Mode otherwise.",
        flavorText: "Changes the Pokémon’s shape when HP is half or less."
    },
    [Abilities.VICTORY_STAR]: {
        effect: "All friendly Pokémon's moves, including this Pokémon's own moves, have 1.1× their usual accuracy while this Pokémon is in battle.",
        shortEffect: "Increases moves' accuracy to 1.1× for friendly Pokémon.",
        flavorText: "Boosts the accuracy of its allies and itself."
    },
    [Abilities.TURBOBLAZE]: {
        effect: "This Pokémon's moves completely ignore abilities that could hinder or prevent their effect on the target.  For example, this Pokémon's moves ignore abilities that would fully negate them, such as water absorb; abilities that would prevent any of their effects, such as clear body, shell armor, or sticky hold; and abilities that grant any general protective benefit, such as simple, snow cloak, or thick fat.  If an ability could either hinder or help this Pokémon's moves, e.g. dry skin or unaware, the ability is ignored either way.  Abilities that do not fit this description, even if they could hinder moves in some other way, are not affected.  For example, cursed body only affects potential future uses of the move, while liquid ooze and shadow tag can only hinder a move's effect on the user.  This ablity cannot ignore type or form changes granted by abilities, for example color change or forecast; nor effects that were caused by abilities but are no longer tied to an ability, such as the rain from drizzle.  This ability cannot ignore multitype at all.  An ability ignored by this ability is only nullified while the move is being used.  For example, this Pokémon's moves can paralyze a Pokémon with limber, but Limber will activate and heal the paralysis immediately thereafter, and this Pokémon's spikes are not affected by this ability after they have been placed.  When this Pokémon enters battle, all participating trainers are notified that it has this ability.  This ability functions identically to mold breaker and teravolt.",
        shortEffect: "Bypasses targets' abilities if they could hinder or prevent moves.",
        flavorText: "The Pokémon's moves are unimpeded by the Ability of the target."
    },
    [Abilities.TERAVOLT]: {
        effect: "This Pokémon's moves completely ignore abilities that could hinder or prevent their effect on the target.  For example, this Pokémon's moves ignore abilities that would fully negate them, such as water absorb; abilities that would prevent any of their effects, such as clear body, shell armor, or sticky hold; and abilities that grant any general protective benefit, such as simple, snow cloak, or thick fat.  If an ability could either hinder or help this Pokémon's moves, e.g. dry skin or unaware, the ability is ignored either way.  Abilities that do not fit this description, even if they could hinder moves in some other way, are not affected.  For example, cursed body only affects potential future uses of the move, while liquid ooze and shadow tag can only hinder a move's effect on the user.  This ablity cannot ignore type or form changes granted by abilities, for example color change or forecast; nor effects that were caused by abilities but are no longer tied to an ability, such as the rain from drizzle.  This ability cannot ignore multitype at all.  An ability ignored by this ability is only nullified while the move is being used.  For example, this Pokémon's moves can paralyze a Pokémon with limber, but Limber will activate and heal the paralysis immediately thereafter, and this Pokémon's spikes are not affected by this ability after they have been placed.  When this Pokémon enters battle, all participating trainers are notified that it has this ability.  This ability functions identically to mold breaker and turboblaze.",
        shortEffect: "Bypasses targets' abilities if they could hinder or prevent moves.",
        flavorText: "The Pokémon's moves are unimpeded by the Ability of the target."
    },
    [Abilities.AROMA_VEIL]: {
        effect: "Protects allies against moves that affect their mental state.",
        shortEffect: "Protects allies against moves that affect their mental state.",
        flavorText: "Protects the Pokémon and its allies from effects that prevent the use of moves."
    },
    [Abilities.FLOWER_VEIL]: {
        effect: "Protects friendly grass Pokémon from having their stats lowered by other Pokémon.",
        shortEffect: "Protects friendly grass Pokémon from having their stats lowered by other Pokémon.",
        flavorText: "Ally Grass-type Pokémon are protected from status conditions and the lowering of their stats."
    },
    [Abilities.CHEEK_POUCH]: {
        effect: "Restores HP upon eating a Berry, in addition to the Berry's effect.",
        shortEffect: "Restores HP upon eating a Berry, in addition to the Berry's effect.",
        flavorText: "The Pokémon's HP is restored when it eats any Berry, in addition to the Berry's usual effect."
    },
    [Abilities.PROTEAN]: {
        effect: "Changes the bearer's type to match each move it uses.  The type change takes place just before the move is used.",
        shortEffect: "Changes the bearer's type to match each move it uses.",
        flavorText: "Changes the Pokémon's type to the type of the move it's about to use. This works only once each time the Pokémon enters battle."
    },
    [Abilities.FUR_COAT]: {
        effect: "Halves damage from physical attacks.",
        shortEffect: "Halves damage from physical attacks.",
        flavorText: "Halves the damage from physical moves."
    },
    [Abilities.MAGICIAN]: {
        effect: "Steals the target's held item when the bearer uses a damaging move.",
        shortEffect: "Steals the target's held item when the bearer uses a damaging move.",
        flavorText: "The Pokémon steals the held item from any target it hits with a move."
    },
    [Abilities.BULLETPROOF]: {
        effect: "Protects against bullet, ball, and bomb-based moves.",
        shortEffect: "Protects against bullet, ball, and bomb-based moves.",
        flavorText: "Protects the Pokémon from ball and bomb moves."
    },
    [Abilities.COMPETITIVE]: {
        effect: "Raises Special Attack by two stages upon having any stat lowered.",
        shortEffect: "Raises Special Attack by two stages upon having any stat lowered.",
        flavorText: "Boosts the Pokémon's Sp. Atk stat sharply when its stats are lowered by an opposing Pokémon."
    },
    [Abilities.STRONG_JAW]: {
        effect: "Strengthens biting moves to 1.5× their power.",
        shortEffect: "Strengthens biting moves to 1.5× their power.",
        flavorText: "The Pokémon's strong jaw boosts the power of its biting moves."
    },
    [Abilities.REFRIGERATE]: {
        effect: "Turns the bearer's normal-type moves into ice-type moves.  Moves changed by this ability have 1.3× their power.",
        shortEffect: "Turns the bearer's normal moves into ice moves and strengthens them to 1.3× their power.",
        flavorText: "Normal-type moves become Ice-type moves. The power of those moves is boosted a little."
    },
    [Abilities.SWEET_VEIL]: {
        effect: "Prevents friendly Pokémon from sleeping.",
        shortEffect: "Prevents friendly Pokémon from sleeping.",
        flavorText: "Prevents the Pokémon and its allies from falling asleep."
    },
    [Abilities.STANCE_CHANGE]: {
        effect: "Changes aegislash to Blade Forme before using a damaging move, or Shield Forme before using kings shield.",
        shortEffect: "Changes aegislash to Blade Forme before using a damaging move, or Shield Forme before using kings shield.",
        flavorText: "The Pokémon changes its form to Blade Forme when it uses an attack move and changes to Shield Forme when it uses King’s Shield."
    },
    [Abilities.GALE_WINGS]: {
        effect: "Raises flying moves' priority by one stage.",
        shortEffect: "Raises flying moves' priority by one stage.",
        flavorText: "Gives priority to the Pokémon's Flying-type moves while its HP is full."
    },
    [Abilities.MEGA_LAUNCHER]: {
        effect: "Strengthens aura and pulse moves to 1.5× their power.",
        shortEffect: "Strengthens aura and pulse moves to 1.5× their power.",
        flavorText: "Powers up pulse moves."
    },
    [Abilities.GRASS_PELT]: {
        effect: "Boosts Defense while grassy terrain is in effect.",
        shortEffect: "Boosts Defense while grassy terrain is in effect.",
        flavorText: "Boosts the Pokémon's Defense stat on Grassy Terrain."
    },
    [Abilities.SYMBIOSIS]: {
        effect: "Passes the bearer's held item to an ally when the ally uses up its item.",
        shortEffect: "Passes the bearer's held item to an ally when the ally uses up its item.",
        flavorText: "The Pokémon passes its held item to an ally that has used up an item."
    },
    [Abilities.TOUGH_CLAWS]: {
        effect: "Strengthens moves that make contact to 1.33× their power.",
        shortEffect: "Strengthens moves that make contact to 1.33× their power.",
        flavorText: "Powers up moves that make direct contact."
    },
    [Abilities.PIXILATE]: {
        effect: "Turns the bearer's normal-type moves into fairy moves.  Moves changed by this ability have 1.3× their power.",
        shortEffect: "Turns the bearer's normal moves into fairy moves and strengthens them to 1.3× their power.",
        flavorText: "Normal-type moves become Fairy-type moves. The power of those moves is boosted a little."
    },
    [Abilities.GOOEY]: {
        effect: "Lowers attacking Pokémon's Speed by one stage on contact.",
        shortEffect: "Lowers attacking Pokémon's Speed by one stage on contact.",
        flavorText: "Contact with the Pokémon lowers the attacker's Speed stat."
    },
    [Abilities.AERILATE]: {
        effect: "Turns the bearer's normal-type moves into flying-type moves.  Moves changed by this ability have 1.3× their power.",
        shortEffect: "Turns the bearer's normal moves into flying moves and strengthens them to 1.3× their power.",
        flavorText: "Normal-type moves become Flying-type moves. The power of those moves is boosted a little."
    },
    [Abilities.PARENTAL_BOND]: {
        effect: "Lets the bearer hit twice with damaging moves.  The second hit has half power.",
        shortEffect: "Lets the bearer hit twice with damaging moves.  The second hit has half power.",
        flavorText: "Parent and child each attacks."
    },
    [Abilities.DARK_AURA]: {
        effect: "Strengthens dark moves for all friendly and opposing Pokémon.",
        shortEffect: "Strengthens dark moves to 1.33× their power for all friendly and opposing Pokémon.",
        flavorText: "Powers up each Pokémon’s Dark-type moves."
    },
    [Abilities.FAIRY_AURA]: {
        effect: "Strengthens fairy moves for all friendly and opposing Pokémon.",
        shortEffect: "Strengthens fairy moves to 1.33× their power for all friendly and opposing Pokémon.",
        flavorText: "Powers up each Pokémon’s Fairy-type moves."
    },
    [Abilities.AURA_BREAK]: {
        effect: "While this Pokémon is on the field, dark aura and fairy aura weaken moves of their respective types to 2/3 their power, rather than strengthening them.",
        shortEffect: "Makes dark aura and fairy aura weaken moves of their respective types.",
        flavorText: "The effects of “Aura” Abilities are reversed to lower the power of affected moves."
    },
    [Abilities.PRIMORDIAL_SEA]: {
        effect: "When this Pokémon enters battle or gains this ability, the weather becomes heavy rain.  Heavy rain has all the properties of rain dance and also causes damaging Fire moves to fail.  Heavy rain ends when this Pokémon leaves battle or loses this ability, or when this ability is nullified.  The weather cannot otherwise be changed except by the effects of delta stream and desolate land.  air lock and cloud nine will prevent the effects of heavy rain, including allowing Fire moves to work, but will not allow the weather to be changed.",
        shortEffect: "Creates heavy rain, which has all the properties of Rain Dance, cannot be replaced, and causes damaging Fire moves to fail.",
        flavorText: "The Pokémon changes the weather to nullify Fire-type attacks."
    },
    [Abilities.DESOLATE_LAND]: {
        effect: "When this Pokémon enters battle or gains this ability, the weather becomes extremely harsh sunlight.  Extremely harsh sunlight has all the properties of sunny day and also causes damaging Water moves to fail.  Extremely harsh sunlight ends when this Pokémon leaves battle or loses this ability, or when this ability is nullified.  The weather cannot otherwise be changed except by the effects of delta stream and primordial sea.  air lock and cloud nine will prevent the effects of extremely harsh sunlight, including allowing Water moves to work, but will not allow the weather to be changed.",
        shortEffect: "Creates extremely harsh sunlight, which has all the properties of Sunny Day, cannot be replaced, and causes damaging Water moves to fail.",
        flavorText: "The Pokémon changes the weather to nullify Water-type attacks."
    },
    [Abilities.DELTA_STREAM]: {
        effect: "When this Pokémon enters battle or gains this ability, the weather becomes a mysterious air current.  A mysterious air current causes moves to not be super effective against Flying; they do neutral damage instead.  anticipation and stealth rock are not affected.  The mysterious air current ends when this Pokémon leaves battle or loses this ability, or when this ability is nullified.  The weather cannot otherwise be changed except by the effects of desolate land and primordial sea.  air lock and cloud nine will prevent the effect of a mysterious air current, but will not allow the weather to be changed.",
        shortEffect: "Creates a mysterious air current, which cannot be replaced and causes moves to never be super effective against Flying Pokémon.",
        flavorText: "The Pokémon changes the weather to eliminate all of the Flying type’s weaknesses."
    },
    [Abilities.STAMINA]: {
        effect: "Raises this Pokémon's Defense by one stage when it takes damage from a move.",
        shortEffect: "Raises this Pokémon's Defense by one stage when it takes damage from a move.",
        flavorText: "Boosts the Defense stat when the Pokémon is hit by an attack."
    },
    [Abilities.WIMP_OUT]: {
        effect: "After this Pokémon is hit by a move, if that move caused this Pokémon's HP to drop below half, it switches out.",
        shortEffect: "This Pokémon automatically switches out when its HP drops below half.",
        flavorText: "The Pokémon cowardly switches out when its HP becomes half or less."
    },
    [Abilities.EMERGENCY_EXIT]: {
        effect: "After this Pokémon is hit by a move, if that move caused this Pokémon's HP to drop below half, it switches out.",
        shortEffect: "This Pokémon automatically switches out when its HP drops below half.",
        flavorText: "The Pokémon, sensing danger, switches out when its HP becomes half or less."
    },
    [Abilities.WATER_COMPACTION]: {
        effect: "Raises this Pokémon's Defense by two stages when it's hit by a Water move.",
        shortEffect: "Raises this Pokémon's Defense by two stages when it's hit by a Water move.",
        flavorText: "Boosts the Defense stat sharply when the Pokémon is hit by a Water-type move."
    },
    [Abilities.MERCILESS]: {
        effect: "This Pokémon's moves critical hit against poisoned targets.",
        shortEffect: "This Pokémon's moves critical hit against poisoned targets.",
        flavorText: "The Pokémon's attacks become critical hits if the target is poisoned."
    },
    [Abilities.SHIELDS_DOWN]: {
        effect: "When this Pokémon enters battle and at the end of each turn, if its HP is 50% or above, it changes into Meteor Form; otherwise, it changes into Core Form.  In Meteor Form, it cannot be given a major status ailment (though existing ones are not cured), cannot become drowsy from yawn, and cannot use rest (which will simply fail).  This ability cannot be copied, replaced, or nullified.  This ability only takes effect for Minior.",
        shortEffect: "Transforms this Minior between Core Form and Meteor Form.  Prevents major status ailments and drowsiness while in Meteor Form.",
        flavorText: "When its HP drops to half or less, the Pokémon's shell breaks and it becomes aggressive."
    },
    [Abilities.STAKEOUT]: {
        effect: "This Pokémon's moves have double power against Pokémon that switched in this turn.",
        shortEffect: "This Pokémon's moves have double power against Pokémon that switched in this turn.",
        flavorText: "Doubles the damage dealt to a target that has just switched into battle."
    },
    [Abilities.WATER_BUBBLE]: {
        effect: "When this Pokémon is hit by a Fire move, the damage is halved.  When this Pokémon uses a Water move, the power is doubled. This Pokémon cannot be burned, and if it becomes burned, the burn is immediately cured.",
        shortEffect: "Halves damage from Fire moves, doubles damage of Water moves, and prevents burns.",
        flavorText: "Lowers the power of Fire-type moves that hit the Pokémon and prevents it from being burned."
    },
    [Abilities.STEELWORKER]: {
        effect: "This Pokémon's Steel moves have 1.5× power.",
        shortEffect: "This Pokémon's Steel moves have 1.5× power.",
        flavorText: "Powers up Steel-type moves."
    },
    [Abilities.BERSERK]: {
        effect: "Whenever this Pokémon takes damage from a move that causes its HP to drop below 50%, its Special Attack rises by one stage.",
        shortEffect: "Raises this Pokémon's Special Attack by one stage every time its HP drops below half.",
        flavorText: "Boosts the Pokémon's Sp. Atk stat when it takes a hit that causes its HP to drop to half or less."
    },
    [Abilities.SLUSH_RUSH]: {
        effect: "During Hail, this Pokémon has double Speed.",
        shortEffect: "During Hail, this Pokémon has double Speed.",
        flavorText: "Boosts the Pokémon's Speed stat in snow."
    },
    [Abilities.LONG_REACH]: {
        effect: "A move used by this Pokémon will not make contact.",
        shortEffect: "This Pokémon's moves do not make contact.",
        flavorText: "The Pokémon uses its moves without making contact with the target."
    },
    [Abilities.LIQUID_VOICE]: {
        effect: "When this Pokémon uses a move that is sound-based, that move's type is Water.",
        shortEffect: "Sound-based moves become Water-type.",
        flavorText: "Sound-based moves become Water-type moves."
    },
    [Abilities.TRIAGE]: {
        effect: "This Pokémon's healing moves have their priority increased by 3.",
        shortEffect: "This Pokémon's healing moves have their priority increased by 3.",
        flavorText: "Gives priority to the Pokémon's healing moves."
    },
    [Abilities.GALVANIZE]: {
        effect: "When this Pokémon uses a Normal moves, that move is Electric its power is 1.2×.",
        shortEffect: "This Pokémon's Normal moves are Electric and have their power increased to 1.2×.",
        flavorText: "Normal-type moves become Electric-type moves. The power of those moves is boosted a little."
    },
    [Abilities.SURGE_SURFER]: {
        effect: "Doubles this Pokémon's Speed on Electric Terrain.",
        shortEffect: "Doubles this Pokémon's Speed on Electric Terrain.",
        flavorText: "Doubles the Pokémon's Speed stat on Electric Terrain."
    },
    [Abilities.SCHOOLING]: {
        effect: "If this Pokémon is a wishiwashi and level 20 or above, then when it enters battle and at the start of each turn, it becomes Schooling Form if its HP is 25% or higher and Solo Form otherwise.  This ability cannot be replaced, copied, or nullified.",
        shortEffect: "Wishiwashi becomes Schooling Form when its HP is 25% or higher.",
        flavorText: "When it has a lot of HP, the Pokémon forms a powerful school. It stops schooling when its HP is low."
    },
    [Abilities.DISGUISE]: {
        effect: "If this Pokémon is in its Disguised Form and takes damage from a move, it switches to its Busted Form and the damage is prevented.  Other effects are not prevented.  This ability cannot be copied or replaced.  This ability only takes effect for Mimikyu.",
        shortEffect: "Prevents the first instance of battle damage.",
        flavorText: "Once per battle, the shroud that covers the Pokémon can protect it from an attack."
    },
    [Abilities.BATTLE_BOND]: {
        effect: "Transforms this Pokémon into Ash-Greninja after fainting an opponent.  Water Shuriken's power is 20 and always hits three times.  This ability cannot be copied or replaced.  This ability only takes effect for Greninja.",
        shortEffect: "Transforms this Pokémon into Ash-Greninja after fainting an opponent.  Water Shuriken's power is 20 and always hits three times.",
        flavorText: "When the Pokémon knocks out a target, its bond with its Trainer is strengthened, and its Attack, Sp. Atk, and Speed stats are boosted."
    },
    [Abilities.POWER_CONSTRUCT]: {
        effect: "Transforms 10% or 50% Zygarde into Complete Forme when its HP is below 50%.  This ability cannot be copied or replaced.  This ability only takes effect for Zygarde.",
        shortEffect: "Transforms 10% or 50% Zygarde into Complete Forme when its HP is below 50%.",
        flavorText: "Other Cells gather to aid when its HP becomes half or less. Then the Pokémon changes its form to Complete Forme."
    },
    [Abilities.CORROSION]: {
        effect: "This Pokémon's moves and item ignore the usual immunity of Poison and Steel Pokémon when attempting to inflict poison.",
        shortEffect: "This Pokémon can inflict poison on Poison and Steel Pokémon.",
        flavorText: "The Pokémon can poison the target even if it's a Steel or Poison type."
    },
    [Abilities.COMATOSE]: {
        effect: "This Pokémon always acts as though it were Asleep.  It cannot be given another status ailment; it's unaffected by yawn; it can use sleep talk; and so on.",
        shortEffect: "This Pokémon always  acts as though it were Asleep.",
        flavorText: "The Pokémon is always drowsing and will never wake up. It can attack while in its sleeping state."
    },
    [Abilities.QUEENLY_MAJESTY]: {
        effect: "When an opposing Pokémon attempts to use a move that targets this Pokémon or an ally, and that move has priority, it will fail.",
        shortEffect: "Opposing Pokémon cannot use priority attacks.",
        flavorText: "When the Pokémon uses Surf or Dive, it will come back with prey. When it takes damage, it will spit out the prey to attack."
    },
    [Abilities.INNARDS_OUT]: {
        effect: "When this Pokémon faints from an opponent's move, that opponent takes damage equal to the HP this Pokémon had remaining.",
        shortEffect: "When this Pokémon faints from an opponent's move, that opponent takes damage equal to the HP this Pokémon had remaining.",
        flavorText: "Damages the attacker landing the finishing hit by the amount equal to its last HP."
    },
    [Abilities.DANCER]: {
        effect: "Whenever another Pokémon uses a dance move, this Pokémon will use the same move immediately afterwards.",
        shortEffect: "Whenever another Pokémon uses a dance move, this Pokémon will use the same move immediately afterwards.",
        flavorText: "Whenever a dance move is used in battle, the Pokémon will copy the user to immediately perform that dance move itself."
    },
    [Abilities.BATTERY]: {
        effect: "Ally Pokémon's moves have their power increased to 1.3×.",
        shortEffect: "Ally Pokémon's moves have their power increased to 1.3×.",
        flavorText: "Powers up ally Pokémon's special moves."
    },
    [Abilities.FLUFFY]: {
        effect: "Damage from contact moves is halved.  Damage from Fire moves is doubled.",
        shortEffect: "Damage from contact moves is halved.  Damage from Fire moves is doubled.",
        flavorText: "Halves the damage taken from moves that make direct contact, but doubles that of Fire-type moves."
    },
    [Abilities.DAZZLING]: {
        effect: "When an opposing Pokémon attempts to use a move that targets this Pokémon or an ally, and that move has priority, it will fail.",
        shortEffect: "Opposing Pokémon cannot use priority attacks.",
        flavorText: "The Pokémon dazzles its opponents, making them unable to use priority moves against the Pokémon or its allies."
    },
    [Abilities.SOUL_HEART]: {
        effect: "This Pokémon's Special Attack rises by one stage every time any Pokémon faints.",
        shortEffect: "This Pokémon's Special Attack rises by one stage every time any Pokémon faints.",
        flavorText: "Boosts the Pokémon's Sp. Atk stat every time another Pokémon faints."
    },
    [Abilities.TANGLING_HAIR]: {
        effect: "When this Pokémon takes regular damage from a contact move, the attacking Pokémon's Speed lowers by one stage.",
        shortEffect: "When this Pokémon takes regular damage from a contact move, the attacking Pokémon's Speed lowers by one stage.",
        flavorText: "Contact with the Pokémon lowers the attacker's Speed stat."
    },
    [Abilities.RECEIVER]: {
        effect: "When an ally faints, this Pokémon gains its Ability.",
        shortEffect: "When an ally faints, this Pokémon gains its Ability.",
        flavorText: "The Pokémon copies the Ability of a defeated ally."
    },
    [Abilities.POWER_OF_ALCHEMY]: {
        effect: "When an ally faints, this Pokémon gains its Ability.",
        shortEffect: "When an ally faints, this Pokémon gains its Ability.",
        flavorText: "The Pokémon copies the Ability of a defeated ally."
    },
    [Abilities.BEAST_BOOST]: {
        effect: "Raises this Pokémon's highest stat by one stage when it faints another Pokémon.",
        shortEffect: "Raises this Pokémon's highest stat by one stage when it faints another Pokémon.",
        flavorText: "The Pokémon boosts its most proficient stat each time it knocks out a Pokémon."
    },
    [Abilities.RKS_SYSTEM]: {
        effect: "Changes this Pokémon's type to match its held Memory.  This ability cannot be copied, replaced, or nullified.  This ability only takes effect for Silvally.",
        shortEffect: "Changes this Pokémon's type to match its held Memory.",
        flavorText: "Changes the Pokémon’s type to match the memory disc it holds."
    },
    [Abilities.ELECTRIC_SURGE]: {
        effect: "When this Pokémon enters battle, it changes the terrain to electric terrain.",
        shortEffect: "When this Pokémon enters battle, it changes the terrain to Electric Terrain.",
        flavorText: "Turns the ground into Electric Terrain when the Pokémon enters a battle."
    },
    [Abilities.PSYCHIC_SURGE]: {
        effect: "When this Pokémon enters battle, it changes the terrain to psychic terrain.",
        shortEffect: "When this Pokémon enters battle, it changes the terrain to Psychic Terrain.",
        flavorText: "Turns the ground into Psychic Terrain when the Pokémon enters a battle."
    },
    [Abilities.MISTY_SURGE]: {
        effect: "When this Pokémon enters battle, it changes the terrain to misty terrain.",
        shortEffect: "When this Pokémon enters battle, it changes the terrain to Misty Terrain.",
        flavorText: "Turns the ground into Misty Terrain when the Pokémon enters a battle."
    },
    [Abilities.GRASSY_SURGE]: {
        effect: "When this Pokémon enters battle, it changes the terrain to grassy terrain.",
        shortEffect: "When this Pokémon enters battle, it changes the terrain to Grassy Terrain.",
        flavorText: "Turns the ground into Grassy Terrain when the Pokémon enters a battle."
    },
    [Abilities.FULL_METAL_BODY]: {
        effect: "This Pokémon's stats cannot be lowered by other Pokémon's moves or abilities.  This effect only applies to normal stat modifications and not more exotic effects such as topsy turvy or power swap.  This Ability is not bypassed by mold breaker, teravolt, or turboblaze.",
        shortEffect: "Other Pokémon cannot lower this Pokémon's stats.",
        flavorText: "Prevents other Pokémon’s moves or Abilities from lowering the Pokémon’s stats."
    },
    [Abilities.SHADOW_SHIELD]: {
        effect: "When this Pokémon has full HP, regular damage (not fixed damage!) from moves is halved.  This ability cannot be nullified.",
        shortEffect: "When this Pokémon has full HP, regular damage from moves is halved.",
        flavorText: "Reduces the amount of damage the Pokémon takes while its HP is full."
    },
    [Abilities.PRISM_ARMOR]: {
        effect: "Super-effective damage this Pokémon takes is reduced to 0.75×.  This Ability is not bypassed by mold breaker, teravolt, or turboblaze.",
        shortEffect: "Reduces super-effective damage to 0.75×.",
        flavorText: "Reduces the power of supereffective attacks taken."
    },
    [Abilities.NEUROFORCE]: {
        effect: "Increases super-effective damage dealt to 1.25×.",
        shortEffect: "Increases super-effective damage dealt to 1.25×.",
        flavorText: "Powers up moves that are super effective."
    },
    [Abilities.INTREPID_SWORD]: {
        effect: "",
        shortEffect: "",
        flavorText: "Boosts the Pokémon’s Attack stat the first time the Pokémon enters a battle."
    },
    [Abilities.DAUNTLESS_SHIELD]: {
        effect: "",
        shortEffect: "",
        flavorText: "Boosts the Pokémon’s Defense stat the first time the Pokémon enters a battle."
    },
    [Abilities.LIBERO]: {
        effect: "",
        shortEffect: "",
        flavorText: "Changes the Pokémon's type to the type of the move it's about to use. This works only once each time the Pokémon enters battle."
    },
    [Abilities.BALL_FETCH]: {
        effect: "",
        shortEffect: "",
        flavorText: "If the Pokémon is not holding an item, it will fetch the Poké Ball from the first failed throw of the battle."
    },
    [Abilities.COTTON_DOWN]: {
        effect: "",
        shortEffect: "",
        flavorText: "When the Pokémon is hit by an attack, it scatters cotton fluff around and lowers the Speed stat of all Pokémon except itself."
    },
    [Abilities.PROPELLER_TAIL]: {
        effect: "",
        shortEffect: "",
        flavorText: "Ignores the effects of opposing Pokémon's Abilities and moves that draw in moves."
    },
    [Abilities.MIRROR_ARMOR]: {
        effect: "",
        shortEffect: "",
        flavorText: "Bounces back only the stat-lowering effects that the Pokémon receives."
    },
    [Abilities.GULP_MISSILE]: {
        effect: "",
        shortEffect: "",
        flavorText: "When the Pokémon uses Surf or Dive, it will come back with prey. When it takes damage, it will spit out the prey to attack."
    },
    [Abilities.STALWART]: {
        effect: "",
        shortEffect: "",
        flavorText: "Ignores the effects of opposing Pokémon's Abilities and moves that draw in moves."
    },
    [Abilities.STEAM_ENGINE]: {
        effect: "",
        shortEffect: "",
        flavorText: "Boosts the Speed stat drastically when the Pokémon is hit by a Fire- or Water-type move."
    },
    [Abilities.PUNK_ROCK]: {
        effect: "",
        shortEffect: "",
        flavorText: "Boosts the power of sound-based moves. The Pokémon also takes half the damage from these kinds of moves."
    },
    [Abilities.SAND_SPIT]: {
        effect: "",
        shortEffect: "",
        flavorText: "The Pokémon creates a sandstorm when it's hit by an attack."
    },
    [Abilities.ICE_SCALES]: {
        effect: "",
        shortEffect: "",
        flavorText: "The Pokémon is protected by ice scales, which halve the damage taken from special moves."
    },
    [Abilities.RIPEN]: {
        effect: "",
        shortEffect: "",
        flavorText: "Ripens Berries and doubles their effect."
    },
    [Abilities.ICE_FACE]: {
        effect: "",
        shortEffect: "",
        flavorText: "The Pokémon's ice head can take a physical attack as a substitute, but the attack also changes the Pokémon's appearance. The ice will be restored when it snows."
    },
    [Abilities.POWER_SPOT]: {
        effect: "",
        shortEffect: "",
        flavorText: "Just being next to the Pokémon powers up moves."
    },
    [Abilities.MIMICRY]: {
        effect: "",
        shortEffect: "",
        flavorText: "Changes the Pokémon’s type depending on the terrain."
    },
    [Abilities.SCREEN_CLEANER]: {
        effect: "",
        shortEffect: "",
        flavorText: "When the Pokémon enters a battle, the effects of Light Screen, Reflect, and Aurora Veil are nullified for both opposing and ally Pokémon."
    },
    [Abilities.STEELY_SPIRIT]: {
        effect: "",
        shortEffect: "",
        flavorText: "Powers up the Steel-type moves of the Pokémon and its allies."
    },
    [Abilities.PERISH_BODY]: {
        effect: "",
        shortEffect: "",
        flavorText: "When hit by a move that makes direct contact, the Pokémon and the attacker will faint after three turns unless they switch out of battle."
    },
    [Abilities.WANDERING_SPIRIT]: {
        effect: "",
        shortEffect: "",
        flavorText: "The Pokémon exchanges Abilities with a Pokémon that hits it with a move that makes direct contact."
    },
    [Abilities.GORILLA_TACTICS]: {
        effect: "",
        shortEffect: "",
        flavorText: "Boosts the Pokémon’s Attack stat but only allows the use of the first selected move."
    },
    [Abilities.NEUTRALIZING_GAS]: {
        effect: "",
        shortEffect: "",
        flavorText: "While the Pokémon is in the battle, the effects of all other Pokémon's Abilities will be nullified or will not be triggered."
    },
    [Abilities.PASTEL_VEIL]: {
        effect: "",
        shortEffect: "",
        flavorText: "Protects the Pokémon and its ally Pokémon from being poisoned."
    },
    [Abilities.HUNGER_SWITCH]: {
        effect: "",
        shortEffect: "",
        flavorText: "The Pokémon changes its form, alternating between its Full Belly Mode and Hangry Mode after the end of every turn."
    },
    [Abilities.QUICK_DRAW]: {
        effect: "",
        shortEffect: "",
        flavorText: "Enables the Pokémon to move first occasionally."
    },
    [Abilities.UNSEEN_FIST]: {
        effect: "",
        shortEffect: "",
        flavorText: "If the Pokémon uses moves that make direct contact, it can attack the target even if the target protects itself."
    },
    [Abilities.CURIOUS_MEDICINE]: {
        effect: "",
        shortEffect: "",
        flavorText: "When the Pokémon enters a battle, it scatters medicine from its shell, which removes all stat changes from allies."
    },
    [Abilities.TRANSISTOR]: {
        effect: "",
        shortEffect: "",
        flavorText: "Powers up Electric-type moves."
    },
    [Abilities.DRAGONS_MAW]: {
        effect: "",
        shortEffect: "",
        flavorText: "Powers up Dragon-type moves."
    },
    [Abilities.CHILLING_NEIGH]: {
        effect: "",
        shortEffect: "",
        flavorText: "When the Pokémon knocks out a target, it utters a chilling neigh, which boosts its Attack stat."
    },
    [Abilities.GRIM_NEIGH]: {
        effect: "",
        shortEffect: "",
        flavorText: "When the Pokémon knocks out a target, it utters a terrifying neigh, which boosts its Sp. Atk stat."
    },
    [Abilities.AS_ONE_GLASTRIER]: {
        effect: "",
        shortEffect: "",
        flavorText: "This Ability combines the effects of both Calyrex's Unnerve Ability and Glastrier's Chilling Neigh Ability."
    },
    [Abilities.AS_ONE_SPECTRIER]: {
        effect: "",
        shortEffect: "",
        flavorText: "This Ability combines the effects of both Calyrex's Unnerve Ability and Spectrier's Grim Neigh Ability."
    },
    [Abilities.LINGERING_AROMA]: {
        effect: "",
        shortEffect: "",
        flavorText: "Contact with the Pokémon changes the attacker's Ability to Lingering Aroma."
    },
    [Abilities.SEED_SOWER]: {
        effect: "",
        shortEffect: "",
        flavorText: "Turns the ground into Grassy Terrain when the Pokémon is hit by an attack."
    },
    [Abilities.THERMAL_EXCHANGE]: {
        effect: "",
        shortEffect: "",
        flavorText: "Boosts the Attack stat when the Pokémon is hit by a Fire-type move. The Pokémon also cannot be burned."
    },
    [Abilities.ANGER_SHELL]: {
        effect: "",
        shortEffect: "",
        flavorText: "When an attack causes its HP to drop to half or less, the Pokémon gets angry. This lowers its Defense and Sp. Def stats but boosts its Attack, Sp. Atk, and Speed stats."
    },
    [Abilities.PURIFYING_SALT]: {
        effect: "",
        shortEffect: "",
        flavorText: "The Pokémon's pure salt protects it from status conditions and halves the damage taken from Ghost-type moves."
    },
    [Abilities.WELL_BAKED_BODY]: {
        effect: "",
        shortEffect: "",
        flavorText: "The Pokémon takes no damage when hit by Fire-type moves. Instead, its Defense stat is sharply boosted."
    },
    [Abilities.WIND_RIDER]: {
        effect: "",
        shortEffect: "",
        flavorText: "Boosts the Pokémon's Attack stat if Tailwind takes effect or if the Pokémon is hit by a wind move. The Pokémon also takes no damage from wind moves."
    },
    [Abilities.GUARD_DOG]: {
        effect: "",
        shortEffect: "",
        flavorText: "Boosts the Pokémon’s Attack stat if intimidated. Moves and items that would force the Pokémon to switch out also fail to work."
    },
    [Abilities.ROCKY_PAYLOAD]: {
        effect: "",
        shortEffect: "",
        flavorText: "Powers up Rock-type moves."
    },
    [Abilities.WIND_POWER]: {
        effect: "",
        shortEffect: "",
        flavorText: "The Pokémon becomes charged when it is hit by a wind move, boosting the power of the next Electric-type move the Pokémon uses."
    },
    [Abilities.ZERO_TO_HERO]: {
        effect: "",
        shortEffect: "",
        flavorText: "The Pokémon transforms into its Hero Form when it switches out."
    },
    [Abilities.COMMANDER]: {
        effect: "",
        shortEffect: "",
        flavorText: "When the Pokémon enters a battle, it goes inside the mouth of an ally Dondozo if one is on the field. The Pokémon then issues commands from there."
    },
    [Abilities.ELECTROMORPHOSIS]: {
        effect: "",
        shortEffect: "",
        flavorText: "The Pokémon becomes charged when it takes damage, boosting the power of the next Electric-type move the Pokémon uses."
    },
    [Abilities.PROTOSYNTHESIS]: {
        effect: "",
        shortEffect: "",
        flavorText: "Boosts the Pokémon's most proficient stat in harsh sunlight or if the Pokémon is holding Booster Energy."
    },
    [Abilities.QUARK_DRIVE]: {
        effect: "",
        shortEffect: "",
        flavorText: "Boosts the Pokémon's most proficient stat on Electric Terrain or if the Pokémon is holding Booster Energy."
    },
    [Abilities.GOOD_AS_GOLD]: {
        effect: "",
        shortEffect: "",
        flavorText: "A body of pure, solid gold gives the Pokémon full immunity to other Pokémon's status moves."
    },
    [Abilities.VESSEL_OF_RUIN]: {
        effect: "",
        shortEffect: "",
        flavorText: "The power of the Pokémon's ruinous vessel lowers the Sp. Atk stats of all Pokémon except itself."
    },
    [Abilities.SWORD_OF_RUIN]: {
        effect: "",
        shortEffect: "",
        flavorText: "The power of the Pokémon's ruinous sword lowers the Defense stats of all Pokémon except itself."
    },
    [Abilities.TABLETS_OF_RUIN]: {
        effect: "",
        shortEffect: "",
        flavorText: "The power of the Pokémon's ruinous wooden tablets lowers the Attack stats of all Pokémon except itself."
    },
    [Abilities.BEADS_OF_RUIN]: {
        effect: "",
        shortEffect: "",
        flavorText: "The power of the Pokémon's ruinous beads lowers the Sp. Def stats of all Pokémon except itself."
    },
    [Abilities.ORICHALCUM_PULSE]: {
        effect: "",
        shortEffect: "",
        flavorText: "Turns the sunlight harsh when the Pokémon enters a battle. The ancient pulse thrumming through the Pokémon also boosts its Attack stat in harsh sunlight."
    },
    [Abilities.HADRON_ENGINE]: {
        effect: "",
        shortEffect: "",
        flavorText: "Turns the ground into Electric Terrain when the Pokémon enters a battle. The futuristic engine within the Pokémon also boosts its Sp. Atk stat on Electric Terrain."
    },
    [Abilities.OPPORTUNIST]: {
        effect: "",
        shortEffect: "",
        flavorText: "If an opponent's stat is boosted, the Pokémon seizes the opportunity to boost the same stat for itself."
    },
    [Abilities.CUD_CHEW]: {
        effect: "",
        shortEffect: "",
        flavorText: "When the Pokémon eats a Berry, it will regurgitate that Berry at the end of the next turn and eat it one more time."
    },
    [Abilities.SHARPNESS]: {
        effect: "",
        shortEffect: "",
        flavorText: "Powers up slicing moves."
    },
    [Abilities.SUPREME_OVERLORD]: {
        effect: "",
        shortEffect: "",
        flavorText: "When the Pokémon enters a battle, its Attack and Sp. Atk stats are slightly boosted for each of the allies in its party that have already been defeated."
    },
    [Abilities.COSTAR]: {
        effect: "",
        shortEffect: "",
        flavorText: "When the Pokémon enters a battle, it copies an ally's stat changes."
    },
    [Abilities.TOXIC_DEBRIS]: {
        effect: "",
        shortEffect: "",
        flavorText: "Scatters poison spikes at the feet of the opposing team when the Pokémon takes damage from physical moves."
    },
    [Abilities.ARMOR_TAIL]: {
        effect: "",
        shortEffect: "",
        flavorText: "The mysterious tail covering the Pokémon's head makes opponents unable to use priority moves against the Pokémon or its allies."
    },
    [Abilities.EARTH_EATER]: {
        effect: "",
        shortEffect: "",
        flavorText: "If hit by a Ground-type move, the Pokémon has its HP restored instead of taking damage."
    },
    [Abilities.MYCELIUM_MIGHT]: {
        effect: "",
        shortEffect: "",
        flavorText: "The Pokémon will always act more slowly when using status moves, but these moves will be unimpeded by the Ability of the target."
    },
    [Abilities.MINDS_EYE]: {
        effect: "",
        shortEffect: "",
        flavorText: "The Pokémon ignores changes to opponents' evasiveness, its accuracy can't be lowered, and it can hit Ghost types with Normal-type and Fighting-type moves"
    },
    [Abilities.SUPERSWEET_SYRUP]: {
        effect: "",
        shortEffect: "",
        flavorText: "Lowers the evasion of opposing Pokémon by 1 stage when first sent into battle"
    },
    [Abilities.HOSPITALITY]: {
        effect: "",
        shortEffect: "",
        flavorText: "When the Pokémon enters a battle, it showers its ally with hospitality, restoring a small amount of the ally's HP"
    },
    [Abilities.TOXIC_CHAIN]: {
        effect: "",
        shortEffect: "",
        flavorText: "The power of the Pokémon's toxic chain may badly poison any target the Pokémon hits with a move"
    },
    [Abilities.EMBODY_ASPECT]: {
        effect: "",
        shortEffect: "",
        flavorText: "The Pokémon's heart fills with memories, causing the Mask to shine and one of the Pokémon's stats to be boosted."
    },
    [Abilities.TERA_SHIFT]: {
        effect: "",
        shortEffect: "",
        flavorText: "When the Pokémon enters a battle, it absorbs the energy around itself and transforms into its Terastal Form."
    },
    [Abilities.TERA_SHELL]: {
        effect: "",
        shortEffect: "",
        flavorText: "The Pokémon's shell contains the powers of each type. All damage-dealing moves that hit the Pokémon when its HP is full will not be very effective."
    },
    [Abilities.TERAFORM_ZERO]: {
        effect: "",
        shortEffect: "",
        flavorText: "When Terapagos changes into its Stellar Form, it uses its hidden powers to eliminate all effects of weather and terrain, reducing them to zero."
    },
    [Abilities.POISON_PUPPETEER]: {
        effect: "",
        shortEffect: "",
        flavorText: "Pokémon poisoned by Pecharunt's moves will also become confused."
    },
    [Abilities.MOUNTAINEER]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.WAVE_RIDER]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.SKATER]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.THRUST]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.PERCEPTION]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.PARRY]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.INSTINCT]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.DODGE]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.JAGGED_EDGE]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.FROSTBITE]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.TENACITY]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.PRIDE]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.DEEP_SLEEP]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.POWER_NAP]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.SPIRIT]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.WARM_BLANKET]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.GULP]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.HERBIVORE]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.SANDPIT]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.HOT_BLOODED]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.MEDIC]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.LIFE_FORCE]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.LUNCHBOX]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.NURSE]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.MELEE]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.SPONGE]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.BODYGUARD]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.HERO]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.LAST_BASTION]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.STEALTH]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.VANGUARD]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.NOMAD]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.SEQUENCE]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.GRASS_CLOAK]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.CELEBRATE]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.LULLABY]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.CALMING]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.DAZE]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.FRIGHTEN]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.INTERFERENCE]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.MOOD_MAKER]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.CONFIDENCE]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.FORTUNE]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.BONANZA]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.EXPLODE]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.OMNIPOTENT]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.SHARE]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.BLACK_HOLE]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.SHADOW_DASH]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.SPRINT]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.DISGUST]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.HIGH_RISE]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.CLIMBER]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.FLAME_BOOST]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.AQUA_BOOST]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.RUN_UP]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.CONQUEROR]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.SHACKLE]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.DECOY]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
    [Abilities.SHIELD]: {
        effect: "",
        shortEffect: "",
        flavorText: ""
    },
};
