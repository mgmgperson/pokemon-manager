/*
core file for world simulation, should be called by the API
to sim the game to a target time or by events (probably time, unsure)

advance world clock on game_state table, working through scheduled events, as 
well as scheduling events and matches as needed

need to create more files to keep each part of the sim isolated, but needs code skeletons for:
- scheduler, for tournament_template, tournament_event, stage_template, match, etc. (Scheduler.ts delegating to TournamentScheduler.ts, and more in future)
- match runner, for running scheduled matche, uses the battlesimulator API in routes/battle.ts for whatever specified match it is (MatchRunner.ts)
- tournament runner, for running scheduled tournaments through its stages (TournamentRunner.ts)
- NPC progression, for moving NPC trainers through their training regimens, travel, etc (NPCProgression.ts)
*/