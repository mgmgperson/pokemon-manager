import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { defaultRegions, defaultCities, defaultStadiums, defaultNameFrequencies } from './default-regions';
import { defaultLocations, defaultTerrains, defaultSpawnRules } from './default-locations';
import {
  defaultTrainers,
  defaultTrainerHometowns,
  defaultGymLeaders,
  defaultEliteFour,
  defaultChampions,
  defaultGrandChampions
} from './default-trainers';
import { defaultPokemon } from './default-pokemon';
import { defaultShops } from './default-shops';
import { 
  defaultMessages, 
  defaultGameState, 
  defaultTrainerFinances, 
  defaultFinancialTransactions, 
  defaultInventory 
} from './default-state';
import {
  defaultRuleSets,
  defaultRules,
  defaultTournamentTemplates,
  defaultStageTemplates,
  defaultQualificationRules,
  defaultPrizes,
  defaultBadges
} from './default-tournaments';
import { defaultEventTemplates, defaultEventInstances, defaultEventOptions } from './default-events';
import { defaultTrainerBadges } from './default-badges';

/**
 * Creates the database schema from schema.sql
 */
export const createDatabaseSchema = (db: sqlite3.Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    const schemaPath = path.join(__dirname, '../../../../database/schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      reject(new Error('Schema file not found'));
      return;
    }

    let schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Clean up the schema by removing problematic comments and empty lines
    schema = schema
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multiline comments
      .replace(/--[^\r\n]*/g, '') // Remove single line comments
      .replace(/\r?\n\s*\r?\n/g, '\n') // Remove empty lines
      .trim();
    
    // Split the schema into individual statements more carefully
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && stmt.toUpperCase().includes('CREATE'));

    let completed = 0;
    const total = statements.length;

    if (total === 0) {
      resolve();
      return;
    }

    statements.forEach((statement, index) => {
      db.run(statement, (err) => {
        if (err) {
          console.error(`Error executing statement ${index + 1}:`, err);
          console.error('Statement:', statement);
          // Don't reject on individual statement failures - some might be expected (like duplicate tables)
        }
        
        completed++;
        if (completed === total) {
          console.log(`Database schema created: ${completed} statements executed`);
          resolve();
        }
      });
    });
  });
};

/**
 * Populates the database with default regions
 */
export const populateDefaultRegions = (db: sqlite3.Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    const insertRegionSql = 'INSERT INTO region (id, name, population) VALUES (?, ?, ?)';
    
    let completed = 0;
    const total = defaultRegions.length;

    if (total === 0) {
      resolve();
      return;
    }

    defaultRegions.forEach((region) => {
      db.run(insertRegionSql, [region.id, region.name, region.population], (err) => {
        if (err) {
          console.error(`Error inserting region ${region.name}:`, err);
          reject(err);
          return;
        }
        
        completed++;
        console.log(`Inserted region: ${region.name}`);
        
        if (completed === total) {
          console.log(`All ${total} regions inserted successfully`);
          resolve();
        }
      });
    });
  });
};

/**
 * Populates the database with default cities for each region
 */
export const populateDefaultCities = (db: sqlite3.Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    const insertCitySql = `
      INSERT INTO city (id, name, region_id, population, x_coordinate, y_coordinate, description) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    let completed = 0;
    const total = defaultCities.length;

    if (total === 0) {
      resolve();
      return;
    }

    defaultCities.forEach((city) => {
      db.run(insertCitySql, [
        city.id,
        city.name, 
        city.regionId, 
        city.population, 
        city.x_coordinate, 
        city.y_coordinate, 
        city.description
      ], (err) => {
        if (err) {
          console.error(`Error inserting city ${city.name}:`, err);
          reject(err);
          return;
        }
        
        completed++;
        console.log(`Inserted city: ${city.name}`);
        
        if (completed === total) {
          console.log(`All ${total} cities inserted successfully`);
          resolve();
        }
      });
    });
  });
};

/**
 * Populates the database with default stadiums
 */
export const populateDefaultStadiums = (db: sqlite3.Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    const insertStadiumSql = `
      INSERT INTO stadium (id, name, type, capacity, city_id) 
      VALUES (?, ?, ?, ?, ?)
    `;

    let completed = 0;
    const total = defaultStadiums.length;

    if (total === 0) {
      resolve();
      return;
    }

    defaultStadiums.forEach((stadium) => {
      db.run(insertStadiumSql, [
        stadium.id,
        stadium.name, 
        stadium.type, 
        stadium.capacity, 
        stadium.cityId
      ], (err) => {
        if (err) {
          console.error(`Error inserting stadium ${stadium.name}:`, err);
          reject(err);
          return;
        }
        
        completed++;
        console.log(`Inserted stadium: ${stadium.name}`);
        
        if (completed === total) {
          console.log(`All ${total} stadiums inserted successfully`);
          resolve();
        }
      });
    });
  });
};

/**
 * Populates the database with default name frequencies
 */
export const populateDefaultNameFrequencies = (db: sqlite3.Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    const insertNameFrequencySql = `
      INSERT INTO region_name_frequency (region_id, frequency, country, type)
      VALUES (?, ?, ?, ?)
    `;

    let completed = 0;
    const total = defaultNameFrequencies.length;

    if (total === 0) {
      resolve();
      return;
    }

    defaultNameFrequencies.forEach((frequency) => {
      db.run(insertNameFrequencySql, [
        frequency.regionId,
        frequency.frequency, 
        frequency.country, 
        frequency.type
      ], (err) => {
        if (err) {
          console.error(`Error inserting name frequency for region ID ${frequency.regionId}:`, err);
          reject(err);
          return;
        }
        
        completed++;
        console.log(`Inserted name frequency for region ID: ${frequency.regionId}`);
        
        if (completed === total) {
          console.log(`All ${total} name frequencies inserted successfully`);
          resolve();
        }
      });
    });
  });
};

/**
 * Populates the database with default terrains
 */
export const populateDefaultTerrains = (db: sqlite3.Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    const insertTerrainSql = `
      INSERT INTO terrain (id, code, name, description)
      VALUES (?, ?, ?, ?)
    `;

    let completed = 0;
    const total = defaultTerrains.length;

    if (total === 0) {
      resolve();
      return;
    }

    defaultTerrains.forEach((terrain) => {
      db.run(insertTerrainSql, [
        terrain.id,
        terrain.code,
        terrain.name,
        terrain.description
      ], (err) => {
        if (err) {
          console.error(`Error inserting terrain ${terrain.name}:`, err);
          reject(err);
          return;
        }
        
        completed++;
        console.log(`Inserted terrain: ${terrain.name}`);
        
        if (completed === total) {
          console.log(`All ${total} terrains inserted successfully`);
          resolve();
        }
      });
    });
  });
};

/**
 * Populates the database with default locations
 */
export const populateDefaultLocations = (db: sqlite3.Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    const insertLocationSql = `
      INSERT INTO location (id, name, region_id, description, population, travel_time, accessibility, area_coordinates)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    let completed = 0;
    const total = defaultLocations.length;

    if (total === 0) {
      resolve();
      return;
    }

    defaultLocations.forEach((location) => {
      db.run(insertLocationSql, [
        location.id,
        location.name,
        location.regionId,
        location.description,
        location.population,
        location.travelTime,
        location.accessibility,
        location.coordinates
      ], (err) => {
        if (err) {
          console.error(`Error inserting location ${location.name}:`, err);
          reject(err);
          return;
        }
        
        completed++;
        console.log(`Inserted location: ${location.name}`);
        
        if (completed === total) {
          console.log(`All ${total} locations inserted successfully`);
          resolve();
        }
      });
    });
  });
};

/**
 * Populates the database with location-terrain relationships
 */
export const populateLocationTerrainMix = (db: sqlite3.Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    const insertLocationTerrainSql = `
      INSERT INTO location_terrain (location_id, terrain_id, rate)
      VALUES (?, ?, ?)
    `;

    let completed = 0;
    let totalInserts = 0;

    // Count total inserts needed
    defaultLocations.forEach(location => {
      totalInserts += Object.keys(location.terrainMix).length;
    });

    if (totalInserts === 0) {
      resolve();
      return;
    }

    defaultLocations.forEach((location) => {
      Object.entries(location.terrainMix).forEach(([terrainCode, rate]) => {
        // Find terrain by code
        const terrain = defaultTerrains.find(t => t.code === terrainCode);
        if (!terrain) {
          console.warn(`Warning: Terrain code '${terrainCode}' not found for location ${location.name}`);
          completed++;
          if (completed === totalInserts) {
            resolve();
          }
          return;
        }

        db.run(insertLocationTerrainSql, [
          location.id,
          terrain.id,
          rate
        ], (err) => {
          if (err) {
            console.error(`Error inserting location-terrain for ${location.name} (${terrainCode}):`, err);
            reject(err);
            return;
          }
          
          completed++;
          console.log(`Inserted location-terrain: ${location.name} -> ${terrain.name} (${rate}%)`);
          
          if (completed === totalInserts) {
            console.log(`All ${totalInserts} location-terrain relationships inserted successfully`);
            resolve();
          }
        });
      });
    });
  });
};

/**
 * Populates the database with default spawn rules
 */
export const populateDefaultSpawnRules = (db: sqlite3.Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    const insertSpawnRuleSql = `
      INSERT INTO terrain_spawn (terrain_id, pokemon_id, rate, time_of_day, season, min_level, max_level, encounter_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    let completed = 0;
    let totalInserts = 0;

    // Count total inserts needed
    defaultSpawnRules.forEach(rule => {
      const allTerrains = [...rule.highSpawn, ...rule.mediumSpawn, ...rule.lowSpawn];
      const timeSlots = rule.time?.length || 1;
      const seasonSlots = rule.season?.length || 1;
      totalInserts += allTerrains.length * timeSlots * seasonSlots;
    });

    if (totalInserts === 0) {
      resolve();
      return;
    }

    defaultSpawnRules.forEach((rule) => {
      const processTerrainList = (terrainCodes: string[], baseRate: number) => {
        terrainCodes.forEach(terrainCode => {
          const terrain = defaultTerrains.find(t => t.code === terrainCode);
          if (!terrain) {
            console.warn(`Warning: Terrain code '${terrainCode}' not found for spawn rule`);
            completed++;
            return;
          }

          const times = rule.time || ['any'];
          const seasons = rule.season || ['any'];

          times.forEach(time => {
            seasons.forEach(season => {
              db.run(insertSpawnRuleSql, [
                terrain.id,
                rule.pokemonId,
                baseRate,
                time,
                season,
                rule.minLevel,
                rule.maxLevel,
                'grass' // default encounter type
              ], (err) => {
                if (err) {
                  console.error(`Error inserting spawn rule for Pokemon ${rule.pokemonId} in ${terrainCode}:`, err);
                  reject(err);
                  return;
                }
                
                completed++;
                
                if (completed === totalInserts) {
                  console.log(`All ${totalInserts} spawn rules inserted successfully`);
                  resolve();
                }
              });
            });
          });
        });
      };

      // Process different spawn rates
      const rateMap = {
        common: 100,
        uncommon: 50,
        rare: 20,
        very_rare: 5,
        event: 1
      };

      const baseRate = rateMap[rule.baseSpawn] || 50;
      
      processTerrainList(rule.highSpawn, Math.floor(baseRate * 1.5));
      processTerrainList(rule.mediumSpawn, baseRate);
      processTerrainList(rule.lowSpawn, Math.floor(baseRate * 0.5));
    });
  });
};

/**
 * Populates the database with default Pokemon
 */
export const populateDefaultPokemon = (db: sqlite3.Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    const insertPokemonSql = `
      INSERT INTO pokemon (trainer_id, species_id, pokemon_id, level, is_gigantamax, is_mega)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    let completed = 0;
    const total = defaultPokemon.length;

    if (total === 0) {
      resolve();
      return;
    }

    const rollback = (error: Error) => {
      db.exec('ROLLBACK', () => reject(error));
    };

    db.serialize(() => {
      db.run('BEGIN TRANSACTION', (beginErr) => {
        if (beginErr) {
          reject(beginErr);
          return;
        }

        const statement = db.prepare(insertPokemonSql, (prepareErr) => {
          if (prepareErr) {
            rollback(prepareErr);
            return;
          }

          const insertPokemonSequentially = async () => {
            for (const pokemon of defaultPokemon) {
              await new Promise<void>((res, rej) => {
                statement.run([
                  pokemon.trainerId,
                  pokemon.speciesId,
                  pokemon.pokemonId,
                  pokemon.level,
                  pokemon.isGigantamax ? 1 : 0,
                  pokemon.isMega ? 1 : 0
                ], (err) => {
                  if (err) {
                    rej(err);
                    return;
                  }

                  completed++;
                  res();
                });
              });
            }
          };

          insertPokemonSequentially()
            .then(() => {
              statement.finalize((finalizeErr) => {
                if (finalizeErr) {
                  rollback(finalizeErr);
                  return;
                }

                db.run('COMMIT', (commitErr) => {
                  if (commitErr) {
                    rollback(commitErr);
                    return;
                  }

                  console.log(`All ${total} Pokemon inserted successfully`);
                  resolve();
                });
              });
            })
            .catch((error) => {
              statement.finalize(() => rollback(error as Error));
            });
        });
      });
    });
  });
};

/**
 * Populates the database with default shops
 */
export const populateDefaultShops = (db: sqlite3.Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    const insertShopSql = `
      INSERT INTO shop (id, name, scope, region_id, terrain_id, location_id, description, markup)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const insertShopItemSql = `
      INSERT INTO shop_item (shop_id, item_id, price, stock)
      VALUES (?, ?, ?, ?)
    `;

    let shopsCompleted = 0;
    let itemsCompleted = 0;
    const totalShops = defaultShops.length;
    let totalItems = 0;

    // Count total items
    defaultShops.forEach(shop => {
      totalItems += shop.items.length;
    });

    if (totalShops === 0) {
      resolve();
      return;
    }

    defaultShops.forEach((shop) => {
      db.run(insertShopSql, [
        shop.id,
        shop.name,
        shop.scope,
        shop.regionId || null,
        shop.terrainId || null,
        shop.locationId || null,
        shop.description || null,
        shop.markup
      ], (err) => {
        if (err) {
          console.error(`Error inserting shop ${shop.name}:`, err);
          reject(err);
          return;
        }
        
        shopsCompleted++;
        console.log(`Inserted shop: ${shop.name}`);
        
        // Insert shop items
        shop.items.forEach((item) => {
          db.run(insertShopItemSql, [
            shop.id,
            item.itemId,
            item.price,
            item.stock || null
          ], (itemErr) => {
            if (itemErr) {
              console.error(`Error inserting shop item for ${shop.name}:`, itemErr);
              reject(itemErr);
              return;
            }
            
            itemsCompleted++;
            console.log(`Inserted shop item: ${item.itemId} in ${shop.name}`);
            
            if (shopsCompleted === totalShops && itemsCompleted === totalItems) {
              console.log(`All ${totalShops} shops and ${totalItems} shop items inserted successfully`);
              resolve();
            }
          });
        });
      });
    });
  });
};

/**
 * Populates the database with default messages
 */
export const populateDefaultMessages = (db: sqlite3.Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    const insertMessageSql = `
      INSERT INTO message (id, sent_at, sender, subject, body, is_read, message_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    let completed = 0;
    const total = defaultMessages.length;

    if (total === 0) {
      resolve();
      return;
    }

    defaultMessages.forEach((message) => {
      db.run(insertMessageSql, [
        message.id,
        message.sentAt,
        message.sender || null,
        message.subject,
        message.body,
        message.isRead ? 1 : 0,
        message.messageType
      ], (err) => {
        if (err) {
          console.error(`Error inserting message ${message.subject}:`, err);
          reject(err);
          return;
        }
        
        completed++;
        console.log(`Inserted message: ${message.subject}`);
        
        if (completed === total) {
          console.log(`All ${total} messages inserted successfully`);
          resolve();
        }
      });
    });
  });
};

/**
 * Populates the database with default game state
 */
export const populateDefaultGameState = (db: sqlite3.Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    const insertGameStateSql = `
      INSERT INTO game_state (id, save_name, created_at, last_played_at, current_date, current_time, active_trainer_id, active_location_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(insertGameStateSql, [
      defaultGameState.id,
      defaultGameState.saveName,
      defaultGameState.createdAt,
      defaultGameState.lastPlayedAt,
      defaultGameState.currentDate,
      defaultGameState.currentTime,
      defaultGameState.activeTrainerId,
      defaultGameState.activeLocationId
    ], (err) => {
      if (err) {
        console.error('Error inserting default game state:', err);
        reject(err);
        return;
      }
      
      console.log('Inserted default game state');
      resolve();
    });
  });
};

/**
 * Populates the database with default trainer finances
 */
export const populateDefaultTrainerFinances = (db: sqlite3.Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    const insertFinanceSql = `
      INSERT INTO trainer_finance (id, trainer_id, balance, debt)
      VALUES (?, ?, ?, ?)
    `;

    let completed = 0;
    const total = defaultTrainerFinances.length;

    if (total === 0) {
      resolve();
      return;
    }

    defaultTrainerFinances.forEach((finance) => {
      db.run(insertFinanceSql, [
        finance.id,
        finance.trainerId,
        finance.balance,
        finance.debt
      ], (err) => {
        if (err) {
          console.error(`Error inserting trainer finance for trainer ${finance.trainerId}:`, err);
          reject(err);
          return;
        }
        
        completed++;
        console.log(`Inserted trainer finance: Trainer ${finance.trainerId} (Balance: ${finance.balance})`);
        
        if (completed === total) {
          console.log(`All ${total} trainer finances inserted successfully`);
          resolve();
        }
      });
    });
  });
};

/**
 * Populates the database with default financial transactions
 */
export const populateDefaultFinancialTransactions = (db: sqlite3.Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    const insertTransactionSql = `
      INSERT INTO financial_transaction (id, trainer_id, amount, description, date, category)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    let completed = 0;
    const total = defaultFinancialTransactions.length;

    if (total === 0) {
      resolve();
      return;
    }

    defaultFinancialTransactions.forEach((transaction) => {
      db.run(insertTransactionSql, [
        transaction.id,
        transaction.trainerId,
        transaction.amount,
        transaction.description || null,
        transaction.date,
        transaction.category
      ], (err) => {
        if (err) {
          console.error(`Error inserting financial transaction ${transaction.id}:`, err);
          reject(err);
          return;
        }
        
        completed++;
        console.log(`Inserted financial transaction: ${transaction.description} (${transaction.amount})`);
        
        if (completed === total) {
          console.log(`All ${total} financial transactions inserted successfully`);
          resolve();
        }
      });
    });
  });
};

/**
 * Populates the database with default inventory items
 */
export const populateDefaultInventory = (db: sqlite3.Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    const insertInventorySql = `
      INSERT INTO inventory (id, trainer_id, item_id, quantity)
      VALUES (?, ?, ?, ?)
    `;

    let completed = 0;
    const total = defaultInventory.length;

    if (total === 0) {
      resolve();
      return;
    }

    defaultInventory.forEach((item) => {
      db.run(insertInventorySql, [
        item.id,
        item.trainerId,
        item.itemId,
        item.quantity
      ], (err) => {
        if (err) {
          console.error(`Error inserting inventory item ${item.id}:`, err);
          reject(err);
          return;
        }
        
        completed++;
        console.log(`Inserted inventory item: Item ${item.itemId} x${item.quantity} for trainer ${item.trainerId}`);
        
        if (completed === total) {
          console.log(`All ${total} inventory items inserted successfully`);
          resolve();
        }
      });
    });
  });
};


/**
 * Populate tournament-related tables: rule sets, rules, templates, stages, qualifications, prizes, badges
 */
export const populateDefaultTournamentsAndRules = (db: sqlite3.Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Rule sets
    const insertRuleSetSql = `INSERT OR IGNORE INTO rule_set (id, name, notes) VALUES (?, ?, ?)`;
    const insertRuleSql = `INSERT OR IGNORE INTO rule (id, rule_set_id, key, value) VALUES (?, ?, ?, ?)`;
    const insertTournamentSql = `INSERT OR IGNORE INTO tournament_template (id, name, description, region_id, frequency, start_month, team_type, default_rule_set_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const insertStageSql = `INSERT OR IGNORE INTO stage_template (id, tournament_template_id, seq, stage_type, participants, groups, best_of, rule_set_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const insertQualificationSql = `INSERT OR IGNORE INTO qualification_rule (id, tournament_template_id, criterion_type, value, notes) VALUES (?, ?, ?, ?, ?)`;
    const insertPrizeSql = `INSERT OR IGNORE INTO prize (id, tournament_template_id, position, prize_type, value) VALUES (?, ?, ?, ?, ?)`;
    const insertBadgeSql = `INSERT OR IGNORE INTO badge (id, code, name, category, region_id, image, description, tournament_template_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    let pending = 0;
    const maybeResolve = () => { if (pending === 0) resolve(); };

    // Insert rule sets
    pending += defaultRuleSets.length;
    if (defaultRuleSets.length === 0) pending = pending; // no-op
    defaultRuleSets.forEach(rs => {
      db.run(insertRuleSetSql, [rs.id, rs.name, rs.notes || null], (err) => {
        if (err) { console.error('Error inserting rule set', rs, err); reject(err); return; }
        pending--;
        maybeResolve();
      });
    });

    // Insert rules
    pending += defaultRules.length;
    defaultRules.forEach(r => {
      db.run(insertRuleSql, [r.id, r.ruleSetId, r.key, r.value], (err) => {
        if (err) { console.error('Error inserting rule', r, err); reject(err); return; }
        pending--;
        maybeResolve();
      });
    });

    // Insert tournament templates
    pending += defaultTournamentTemplates.length;
    defaultTournamentTemplates.forEach(t => {
      db.run(insertTournamentSql, [
        t.id,
        t.name,
        t.description || null,
        t.regionId || null,
        t.frequency,
        t.startMonth || null,
        t.teamType,
        t.defaultRuleSetId || null
      ], (err) => {
        if (err) { console.error('Error inserting tournament template', t, err); reject(err); return; }
        pending--;
        maybeResolve();
      });
    });

    // Insert stage templates
    pending += defaultStageTemplates.length;
    defaultStageTemplates.forEach(s => {
      db.run(insertStageSql, [
        s.id,
        s.tournamentTemplateId,
        s.seq,
        s.stageType,
        s.participants || null,
        s.groups || null,
        s.bestOf || null,
        s.ruleSetId || null
      ], (err) => {
        if (err) { console.error('Error inserting stage template', s, err); reject(err); return; }
        pending--;
        maybeResolve();
      });
    });

    // Qualification rules
    pending += defaultQualificationRules.length;
    defaultQualificationRules.forEach(q => {
      db.run(insertQualificationSql, [q.id, q.tournamentTemplateId, q.criterionType, q.value, q.notes || null], (err) => {
        if (err) { console.error('Error inserting qualification rule', q, err); reject(err); return; }
        pending--;
        maybeResolve();
      });
    });

    // Prizes
    pending += defaultPrizes.length;
    defaultPrizes.forEach(p => {
      db.run(insertPrizeSql, [p.id, p.tournamentTemplateId, p.position, p.prizeType, p.value], (err) => {
        if (err) { console.error('Error inserting prize', p, err); reject(err); return; }
        pending--;
        maybeResolve();
      });
    });

    // Badges
    pending += defaultBadges.length;
    defaultBadges.forEach(b => {
      db.run(insertBadgeSql, [b.id, b.code, b.name, b.category, b.regionId || null, b.image || null, b.description || null, b.tournamentTemplateId || null], (err) => {
        if (err) { console.error('Error inserting badge', b, err); reject(err); return; }
        pending--;
        maybeResolve();
      });
    });

    // If there was nothing to insert, resolve immediately
    if (pending === 0) resolve();
  });
};


/**
 * Populate event-related tables: templates, instances, options
 */
export const populateDefaultEvents = (db: sqlite3.Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    const insertEventTemplateSql = `INSERT OR IGNORE INTO event_template (id, code, name, type, description, default_payload_json, auto_open_overlay) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const insertEventInstanceSql = `INSERT OR IGNORE INTO event_instance (id, template_id, type, title, subtitle, status, starts_at, ends_at, priority, payload_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const insertEventOptionSql = `INSERT OR IGNORE INTO event_option (id, event_id, kind, label, body, sort_order, conditions_json, effects_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    let pending = 0;
    const maybeResolve = () => { if (pending === 0) resolve(); };

    pending += defaultEventTemplates.length;
    defaultEventTemplates.forEach(t => {
      db.run(insertEventTemplateSql, [t.id, t.code, t.name, t.type, t.description || null, t.defaultPayloadJson || null, t.autoOpenOverlay ? 1 : 0], (err) => {
        if (err) { console.error('Error inserting event template', t, err); reject(err); return; }
        pending--;
        maybeResolve();
      });
    });

    pending += defaultEventInstances.length;
    defaultEventInstances.forEach(e => {
      db.run(insertEventInstanceSql, [
        e.id,
        e.templateId || null,
        e.type,
        e.title,
        e.subtitle || null,
        e.status,
        e.startsAt,
        e.endsAt || null,
        e.priority || null,
        e.payloadJson || null
      ], (err) => {
        if (err) { console.error('Error inserting event instance', e, err); reject(err); return; }
        pending--;
        maybeResolve();
      });
    });

    pending += defaultEventOptions.length;
    defaultEventOptions.forEach(o => {
      db.run(insertEventOptionSql, [o.id, o.eventId, o.kind, o.label || null, o.body || null, o.sortOrder || null, o.conditionsJson || null, o.effectsJson || null], (err) => {
        if (err) { console.error('Error inserting event option', o, err); reject(err); return; }
        pending--;
        maybeResolve();
      });
    });

    if (pending === 0) resolve();
  });
};


/**
 * Populates the database with default trainer badges (pre-generated tournament winners)
 */
export const populateDefaultBadges = (db: sqlite3.Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    const insertBadgeSql = `
      INSERT INTO trainer_badge (id, trainer_id, badge_id, awarded_at, source_event_id, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    let completed = 0;
    const total = defaultTrainerBadges.length;

    if (total === 0) {
      resolve();
      return;
    }

    defaultTrainerBadges.forEach((badge) => {
      db.run(insertBadgeSql, [
        badge.id,
        badge.trainer_id,
        badge.badge_id,
        badge.awarded_at,
        badge.source_event_id,
        badge.notes
      ], (err) => {
        if (err) {
          console.error(`Error inserting trainer badge ${badge.id}:`, err);
          reject(err);
          return;
        }
        completed++;
        if (completed === total) {
          console.log(`Successfully populated ${total} default trainer badges`);
          resolve();
        }
      });
    });
  });
};


/**
 * Populates the database with the full set of default trainers and related records
 */
export const populateDefaultTrainers = (db: sqlite3.Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Trainers
    const insertTrainerSql = `INSERT OR IGNORE INTO trainer (id, fname, lname, region_id, birthdate, pwtr_rating, peak_rating, peak_rank, active_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    let trainersCompleted = 0;
    const totalTrainers = defaultTrainers.length;

    // We'll treat three sections: trainers, hometowns, leaders (gym/elite/champion)
    let sectionsToComplete = 3;
    let sectionsDone = 0;
    const sectionDone = () => {
      sectionsDone++;
      if (sectionsDone >= sectionsToComplete) resolve();
    };

    // Insert trainers
    if (totalTrainers === 0) {
      sectionDone();
    } else {
      defaultTrainers.forEach((t) => {
        db.run(insertTrainerSql, [
          t.id,
          t.fname || null,
          t.lname || null,
          t.regionId || null,
          t.birthdate || null,
          t.pwtrRating || null,
          t.peakRating || null,
          t.peakRank || null,
          t.activeStatus ? 1 : 0
        ], (err) => {
          if (err) {
            console.error(`Error inserting trainer ${t.id}:`, err);
            reject(err);
            return;
          }

          trainersCompleted++;
          if (trainersCompleted === totalTrainers) {
            console.log(`All ${totalTrainers} trainers inserted`);
            sectionDone();
          }
        });
      });
    }

    // Trainer hometowns
    const insertHometownSql = `INSERT OR IGNORE INTO trainer_hometown (id, trainer_id, city_id) VALUES (?, ?, ?)`;
    const totalHometowns = (defaultTrainerHometowns || []).length;
    let hometownsCompleted = 0;
    if (totalHometowns === 0) {
      sectionDone();
    } else {
      defaultTrainerHometowns.forEach((h) => {
        db.run(insertHometownSql, [h.id, h.trainerId, h.cityId], (err) => {
          if (err) { console.error(`Error inserting trainer hometown ${h.id}:`, err); reject(err); return; }
          hometownsCompleted++;
          if (hometownsCompleted === totalHometowns) {
            console.log(`All ${totalHometowns} trainer hometowns inserted`);
            sectionDone();
          }
        });
      });
    }

    // Gym leaders, elite four, champions, grand champions
    const insertGymSql = `INSERT INTO gym_leader (id, trainer_id, badge, city_id, type) VALUES (?, ?, ?, ?, ?)`;
    const insertEliteSql = `INSERT INTO elite_four (id, trainer_id, region_id) VALUES (?, ?, ?)`;
    const insertChampionSql = `INSERT INTO champion (id, trainer_id, region_id) VALUES (?, ?, ?)`;
    const insertGrandChampionSql = `INSERT INTO grand_champion (id, trainer_id) VALUES (?, ?)`;

    let leadersToInsert = 0;
    leadersToInsert += (defaultGymLeaders || []).length;
    leadersToInsert += (defaultEliteFour || []).length;
    leadersToInsert += (defaultChampions || []).length;
    leadersToInsert += (defaultGrandChampions || []).length;

    if (leadersToInsert === 0) {
      sectionDone();
    } else {
      let leadersCompleted = 0;
      const maybeSectionDone = () => {
        leadersCompleted++;
        if (leadersCompleted === leadersToInsert) {
          console.log(`All ${leadersToInsert} leader records inserted`);
          sectionDone();
        }
      };

      (defaultGymLeaders || []).forEach((g) => {
        db.run(insertGymSql, [g.id, g.trainerId, g.badge || null, g.cityId, g.type || 'None'], (err) => {
          if (err) { console.error(`Error inserting gym leader ${g.id}:`, err); reject(err); return; }
          maybeSectionDone();
        });
      });

      (defaultEliteFour || []).forEach((e) => {
        db.run(insertEliteSql, [e.id, e.trainerId, e.regionId], (err) => {
          if (err) { console.error(`Error inserting elite four ${e.id}:`, err); reject(err); return; }
          maybeSectionDone();
        });
      });

      (defaultChampions || []).forEach((c) => {
        db.run(insertChampionSql, [c.id, c.trainerId, c.regionId], (err) => {
          if (err) { console.error(`Error inserting champion ${c.id}:`, err); reject(err); return; }
          maybeSectionDone();
        });
      });

      (defaultGrandChampions || []).forEach((gc) => {
        db.run(insertGrandChampionSql, [gc.id, gc.trainerId], (err) => {
          if (err) { console.error(`Error inserting grand champion ${gc.id}:`, err); reject(err); return; }
          maybeSectionDone();
        });
      });
    }
  });
};

/**
 * Main function to populate database with all default data
 */
export const populateDefaultData = async (db: sqlite3.Database): Promise<void> => {
  try {
    console.log('Creating database schema...');
    await createDatabaseSchema(db);
    
    console.log('Populating default regions...');
    await populateDefaultRegions(db);
    
    console.log('Populating default cities...');
    await populateDefaultCities(db);
    
    console.log('Populating default stadiums...');
    await populateDefaultStadiums(db);
    
    console.log('Populating default name frequencies...');
    await populateDefaultNameFrequencies(db);
    
    console.log('Populating default terrains...');
    await populateDefaultTerrains(db);
    
    console.log('Populating default locations...');
    await populateDefaultLocations(db);
    
    console.log('Populating location-terrain relationships...');
    await populateLocationTerrainMix(db);
    
    console.log('Populating default spawn rules...');
    await populateDefaultSpawnRules(db);
    
    console.log('Populating default tournaments (rule sets, templates, badges)...');
    await populateDefaultTournamentsAndRules(db);

    console.log('Populating default events (templates, instances, options)...');
    await populateDefaultEvents(db);
    
    console.log('Populating default trainers and leader data...');
    await populateDefaultTrainers(db);
    
    console.log('Populating default Pokemon...');
    await populateDefaultPokemon(db);
    
    console.log('Populating default shops...');
    await populateDefaultShops(db);
    
    console.log('Populating default messages...');
    await populateDefaultMessages(db);
    
    console.log('Populating default game state...');
    await populateDefaultGameState(db);
    
    console.log('Populating default trainer finances...');
    await populateDefaultTrainerFinances(db);
    
    console.log('Populating default financial transactions...');
    await populateDefaultFinancialTransactions(db);
    
    console.log('Populating default inventory...');
    await populateDefaultInventory(db);
    
    console.log('Populating default trainer badges (tournament winners)...');
    await populateDefaultBadges(db);
    
    console.log('Default data population completed successfully!');
  } catch (error) {
    console.error('Error populating default data:', error);
    throw error;
  }
};
