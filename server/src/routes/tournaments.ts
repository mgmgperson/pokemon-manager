import { Router, Request, Response } from 'express';
import { getActiveDB } from '../services/dbManager';

const router: Router = Router();

// GET /tournaments - Get all tournament templates
router.get('/', (req: Request, res: Response) => {
  const db = getActiveDB();
  
  const sql = `
    SELECT 
      tt.id,
      tt.name,
      tt.description,
      tt.region_id,
      r.name as region_name,
      tt.frequency,
      tt.start_month,
      tt.team_type,
      tt.default_rule_set_id,
      rs.name as default_rule_set_name
    FROM tournament_template tt
    LEFT JOIN region r ON tt.region_id = r.id
    LEFT JOIN rule_set rs ON tt.default_rule_set_id = rs.id
    ORDER BY tt.name
  `;

  db.all(sql, [], (err: Error | null, rows: any[]) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    
    const tournaments = rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      region: row.region_id ? {
        id: row.region_id,
        name: row.region_name
      } : null,
      frequency: row.frequency,
      start_month: row.start_month,
      team_type: row.team_type,
      default_rule_set: row.default_rule_set_id ? {
        id: row.default_rule_set_id,
        name: row.default_rule_set_name
      } : null
    }));

    return res.json({
      message: 'success',
      data: tournaments
    });
  });
});

// GET /tournaments/:id - Get a specific tournament with all details
router.get('/:id', (req: Request, res: Response) => {
  const db = getActiveDB();
  const tournamentId = req.params.id;

  // Main tournament template query
  const sqlTemplate = `
    SELECT 
      tt.id,
      tt.name,
      tt.description,
      tt.region_id,
      r.name as region_name,
      tt.frequency,
      tt.start_month,
      tt.team_type,
      tt.default_rule_set_id,
      rs.name as default_rule_set_name
    FROM tournament_template tt
    LEFT JOIN region r ON tt.region_id = r.id
    LEFT JOIN rule_set rs ON tt.default_rule_set_id = rs.id
    WHERE tt.id = ?
  `;

  // Stage templates query
  const sqlStages = `
    SELECT 
      st.id,
      st.seq,
      st.stage_type,
      st.participants,
      st.groups,
      st.best_of,
      st.rule_set_id,
      rs.name as rule_set_name
    FROM stage_template st
    LEFT JOIN rule_set rs ON st.rule_set_id = rs.id
    WHERE st.tournament_template_id = ?
    ORDER BY st.seq
  `;

  // Qualification rules query
  const sqlQualifications = `
    SELECT 
      qr.id,
      qr.criterion_type,
      qr.value,
      qr.notes
    FROM qualification_rule qr
    WHERE qr.tournament_template_id = ?
  `;

  // Prizes query
  const sqlPrizes = `
    SELECT 
      p.id,
      p.position,
      p.prize_type,
      p.value
    FROM prize p
    WHERE p.tournament_template_id = ?
    ORDER BY p.position
  `;

  // Badge query
  const sqlBadges = `
    SELECT 
      b.id,
      b.code,
      b.name,
      b.category,
      b.description
    FROM badge b
    WHERE b.tournament_template_id = ?
  `;

  db.get(sqlTemplate, [tournamentId], (err: Error | null, templateRow: any) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!templateRow) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Get stages
    db.all(sqlStages, [tournamentId], (err2: Error | null, stageRows: any[]) => {
      if (err2) {
        return res.status(400).json({ error: err2.message });
      }

      // Get qualifications
      db.all(sqlQualifications, [tournamentId], (err3: Error | null, qualRows: any[]) => {
        if (err3) {
          return res.status(400).json({ error: err3.message });
        }

        // Get prizes
        db.all(sqlPrizes, [tournamentId], (err4: Error | null, prizeRows: any[]) => {
          if (err4) {
            return res.status(400).json({ error: err4.message });
          }

          // Get badges
          db.all(sqlBadges, [tournamentId], (err5: Error | null, badgeRows: any[]) => {
            if (err5) {
              return res.status(400).json({ error: err5.message });
            }

            const tournament = {
              id: templateRow.id,
              name: templateRow.name,
              description: templateRow.description,
              region: templateRow.region_id ? {
                id: templateRow.region_id,
                name: templateRow.region_name
              } : null,
              frequency: templateRow.frequency,
              start_month: templateRow.start_month,
              team_type: templateRow.team_type,
              default_rule_set: templateRow.default_rule_set_id ? {
                id: templateRow.default_rule_set_id,
                name: templateRow.default_rule_set_name
              } : null,
              stages: stageRows.map(stage => ({
                id: stage.id,
                seq: stage.seq,
                stage_type: stage.stage_type,
                participants: stage.participants,
                groups: stage.groups,
                best_of: stage.best_of,
                rule_set: stage.rule_set_id ? {
                  id: stage.rule_set_id,
                  name: stage.rule_set_name
                } : null
              })),
              qualification_rules: qualRows.map(qual => ({
                id: qual.id,
                criterion_type: qual.criterion_type,
                value: qual.value,
                notes: qual.notes
              })),
              prizes: prizeRows.map(prize => ({
                id: prize.id,
                position: prize.position,
                prize_type: prize.prize_type,
                value: prize.value
              })),
              badges: badgeRows.map(badge => ({
                id: badge.id,
                code: badge.code,
                name: badge.name,
                category: badge.category,
                description: badge.description
              }))
            };

            return res.json({
              message: 'success',
              data: tournament
            });
          });
        });
      });
    });
  });
});

// GET /tournaments/:id/events - Get all events (instances) of a tournament
router.get('/:id/events', (req: Request, res: Response) => {
  const db = getActiveDB();
  const tournamentId = req.params.id;

  const sql = `
    SELECT 
      te.id,
      te.edition_label,
      te.start_date,
      te.end_date,
      te.status
    FROM tournament_event te
    WHERE te.template_id = ?
    ORDER BY te.start_date DESC
  `;

  db.all(sql, [tournamentId], (err: Error | null, rows: any[]) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    return res.json({
      message: 'success',
      data: rows.map(row => ({
        id: row.id,
        edition_label: row.edition_label,
        start_date: row.start_date,
        end_date: row.end_date,
        status: row.status
      }))
    });
  });
});

// GET /tournaments/events/:eventId - Get a specific tournament event with participants
router.get('/events/:eventId', (req: Request, res: Response) => {
  const db = getActiveDB();
  const eventId = req.params.eventId;

  // Event details
  const sqlEvent = `
    SELECT 
      te.id,
      te.template_id,
      tt.name as tournament_name,
      te.edition_label,
      te.start_date,
      te.end_date,
      te.status
    FROM tournament_event te
    JOIN tournament_template tt ON te.template_id = tt.id
    WHERE te.id = ?
  `;

  // Stage events
  const sqlStages = `
    SELECT 
      se.id,
      se.status,
      st.seq,
      st.stage_type,
      st.participants,
      st.groups,
      st.best_of
    FROM stage_event se
    JOIN stage_template st ON se.stage_template_id = st.id
    WHERE se.tournament_event_id = ?
    ORDER BY st.seq
  `;

  // Participants (with trainer info)
  const sqlParticipants = `
    SELECT 
      tp.id as participant_id,
      tp.seed,
      tp.stage_event_id,
      tm.trainer_id,
      t.fname,
      t.lname,
      t.pwtr_rating
    FROM tournament_participant tp
    JOIN team_member tm ON tp.id = tm.participant_id
    JOIN trainer t ON tm.trainer_id = t.id
    WHERE tp.stage_event_id IN (
      SELECT se.id FROM stage_event se WHERE se.tournament_event_id = ?
    )
    ORDER BY tp.seed
  `;

  db.get(sqlEvent, [eventId], (err: Error | null, eventRow: any) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!eventRow) {
      return res.status(404).json({ message: 'Tournament event not found' });
    }

    db.all(sqlStages, [eventId], (err2: Error | null, stageRows: any[]) => {
      if (err2) {
        return res.status(400).json({ error: err2.message });
      }

      db.all(sqlParticipants, [eventId], (err3: Error | null, participantRows: any[]) => {
        if (err3) {
          return res.status(400).json({ error: err3.message });
        }

        const event = {
          id: eventRow.id,
          template_id: eventRow.template_id,
          tournament_name: eventRow.tournament_name,
          edition_label: eventRow.edition_label,
          start_date: eventRow.start_date,
          end_date: eventRow.end_date,
          status: eventRow.status,
          stages: stageRows.map(stage => ({
            id: stage.id,
            seq: stage.seq,
            stage_type: stage.stage_type,
            participants: stage.participants,
            groups: stage.groups,
            best_of: stage.best_of,
            status: stage.status
          })),
          participants: participantRows.map(p => ({
            id: p.participant_id,
            seed: p.seed,
            stage_event_id: p.stage_event_id,
            trainer: {
              id: p.trainer_id,
              name: `${p.fname} ${p.lname}`,
              rating: p.pwtr_rating
            }
          }))
        };

        return res.json({
          message: 'success',
          data: event
        });
      });
    });
  });
});

// GET /tournaments/:id/rule-sets/:ruleSetId - Get details of a rule set
router.get('/rule-sets/:ruleSetId', (req: Request, res: Response) => {
  const db = getActiveDB();
  const ruleSetId = req.params.ruleSetId;

  const sqlRuleSet = `
    SELECT id, name, notes
    FROM rule_set
    WHERE id = ?
  `;

  const sqlRules = `
    SELECT id, key, value
    FROM rule
    WHERE rule_set_id = ?
    ORDER BY key
  `;

  db.get(sqlRuleSet, [ruleSetId], (err: Error | null, ruleSetRow: any) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!ruleSetRow) {
      return res.status(404).json({ message: 'Rule set not found' });
    }

    db.all(sqlRules, [ruleSetId], (err2: Error | null, ruleRows: any[]) => {
      if (err2) {
        return res.status(400).json({ error: err2.message });
      }

      const ruleSet = {
        id: ruleSetRow.id,
        name: ruleSetRow.name,
        notes: ruleSetRow.notes,
        rules: ruleRows.map(rule => ({
          id: rule.id,
          key: rule.key,
          value: rule.value
        }))
      };

      return res.json({
        message: 'success',
        data: ruleSet
      });
    });
  });
});

// GET /tournaments/events/:eventId/matches - Get all matches for a tournament event
router.get('/events/:eventId/matches', (req: Request, res: Response) => {
  const db = getActiveDB();
  const eventId = req.params.eventId;

  const sql = `
    SELECT 
      m.id,
      m.round,
      m.scheduled_at,
      m.winner_id,
      se.id as stage_event_id,
      st.seq as stage_seq,
      st.stage_type,
      pa.seed as participant_a_seed,
      ta.id as trainer_a_id,
      ta.fname as trainer_a_fname,
      ta.lname as trainer_a_lname,
      pb.seed as participant_b_seed,
      tb.id as trainer_b_id,
      tb.fname as trainer_b_fname,
      tb.lname as trainer_b_lname,
      s.name as stadium_name,
      c.name as city_name
    FROM match m
    JOIN stage_event se ON m.stage_event_id = se.id
    JOIN stage_template st ON se.stage_template_id = st.id
    JOIN tournament_participant pa ON m.participant_a_id = pa.id
    JOIN tournament_participant pb ON m.participant_b_id = pb.id
    JOIN team_member tma ON pa.id = tma.participant_id
    JOIN team_member tmb ON pb.id = tmb.participant_id
    JOIN trainer ta ON tma.trainer_id = ta.id
    JOIN trainer tb ON tmb.trainer_id = tb.id
    LEFT JOIN stadium s ON m.stadium_id = s.id
    LEFT JOIN city c ON s.city_id = c.id
    WHERE se.tournament_event_id = ?
    ORDER BY st.seq, m.round, m.scheduled_at
  `;

  db.all(sql, [eventId], (err: Error | null, rows: any[]) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    const matches = rows.map(row => ({
      id: row.id,
      stage: {
        id: row.stage_event_id,
        seq: row.stage_seq,
        type: row.stage_type
      },
      round: row.round,
      scheduled_at: row.scheduled_at,
      participant_a: {
        seed: row.participant_a_seed,
        trainer: {
          id: row.trainer_a_id,
          name: `${row.trainer_a_fname} ${row.trainer_a_lname}`
        }
      },
      participant_b: {
        seed: row.participant_b_seed,
        trainer: {
          id: row.trainer_b_id,
          name: `${row.trainer_b_fname} ${row.trainer_b_lname}`
        }
      },
      winner_id: row.winner_id,
      stadium: row.stadium_name ? {
        name: row.stadium_name,
        city: row.city_name
      } : null
    }));

    return res.json({
      message: 'success',
      data: matches
    });
  });
});

// GET /tournaments/badges - Get all badges
router.get('/badges', (req: Request, res: Response) => {
  const db = getActiveDB();
  
  const sql = `
    SELECT 
      b.id,
      b.code,
      b.name,
      b.category,
      b.region_id,
      r.name as region_name,
      b.image,
      b.description,
      b.tournament_template_id,
      tt.name as tournament_name
    FROM badge b
    LEFT JOIN region r ON b.region_id = r.id
    LEFT JOIN tournament_template tt ON b.tournament_template_id = tt.id
    ORDER BY b.category, b.name
  `;

  db.all(sql, [], (err: Error | null, rows: any[]) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    const badges = rows.map(row => ({
      id: row.id,
      code: row.code,
      name: row.name,
      category: row.category,
      region: row.region_id ? {
        id: row.region_id,
        name: row.region_name
      } : null,
      image: row.image,
      description: row.description,
      tournament: row.tournament_template_id ? {
        id: row.tournament_template_id,
        name: row.tournament_name
      } : null
    }));

    return res.json({
      message: 'success',
      data: badges
    });
  });
});

// GET /tournaments/trainers/:trainerId/badges - Get all badges for a trainer
router.get('/trainers/:trainerId/badges', (req: Request, res: Response) => {
  const db = getActiveDB();
  const trainerId = req.params.trainerId;

  const sql = `
    SELECT 
      tb.id as trainer_badge_id,
      tb.awarded_at,
      tb.notes,
      b.id as badge_id,
      b.code,
      b.name,
      b.category,
      b.description,
      te.id as event_id,
      te.edition_label
    FROM trainer_badge tb
    JOIN badge b ON tb.badge_id = b.id
    LEFT JOIN tournament_event te ON tb.source_event_id = te.id
    WHERE tb.trainer_id = ?
    ORDER BY tb.awarded_at DESC
  `;

  db.all(sql, [trainerId], (err: Error | null, rows: any[]) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    const badges = rows.map(row => ({
      id: row.trainer_badge_id,
      awarded_at: row.awarded_at,
      notes: row.notes,
      badge: {
        id: row.badge_id,
        code: row.code,
        name: row.name,
        category: row.category,
        description: row.description
      },
      source_event: row.event_id ? {
        id: row.event_id,
        edition_label: row.edition_label
      } : null
    }));

    return res.json({
      message: 'success',
      data: badges
    });
  });
});

export default router;
