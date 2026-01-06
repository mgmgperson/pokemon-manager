/*
API for game simulation - when called should sim to the next time step in the game
(e.g. next day, next hour, etc) and update game state accordingly

should update the database, and return metadata about what changed

request body core:
- mode ("by time" | "by event" | etc)
- time step to simulate (e.g. 'day', 'hour', etc)
- max steps (to avoid infinite loops)
- seed (for randomization control)
- update (whether to update the DB or just simulate, mostly for testing)

response core:
- fromTime, toTime
- event ids triggered
- simmed matches ids
- awarded badges
- notes (debug/info)


There will need to be a helper too for what is the next event to simulate up to, based on the database state
Something like min(event_instance.starts_at, match.scheduled_at, tournament_event.start_date), or if none exist, then just advance by a default time step (e.g. 1 day or 12 hours)
*/