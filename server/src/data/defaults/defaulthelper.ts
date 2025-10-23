import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { defaultRegions, defaultCities, defaultStadiums, defaultNameFrequencies } from './default-regions';
import { defaultLocations, defaultTerrains, defaultSpawnRules } from './default-locations';
import { defaultPokemon } from './default-pokemon';
import { defaultShops } from './default-shops';
import { 
  defaultMessages, 
  defaultGameState, 
  defaultTrainerFinances, 
  defaultFinancialTransactions, 
  defaultInventory 
} from './default-state';

interface Region {
  id: number;
  name: string;
  population: number;
}

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

    defaultPokemon.forEach((pokemon) => {
      db.run(insertPokemonSql, [
        pokemon.trainerId,
        pokemon.speciesId,
        pokemon.pokemonId,
        pokemon.level,
        pokemon.isGigantamax ? 1 : 0,
        pokemon.isMega ? 1 : 0
      ], (err) => {
        if (err) {
          console.error(`Error inserting Pokemon for trainer ${pokemon.trainerId}:`, err);
          reject(err);
          return;
        }
        
        completed++;
        console.log(`Inserted Pokemon: Species ${pokemon.speciesId} (Level ${pokemon.level})`);
        
        if (completed === total) {
          console.log(`All ${total} Pokemon inserted successfully`);
          resolve();
        }
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
 * Populates the database with a default trainer
 */
export const populateDefaultTrainer = (db: sqlite3.Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    const insertTrainerSql = `
      INSERT INTO trainer (id, fname, lname, region_id, birthdate, pwtr_rating, peak_rating, peak_rank, active_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(insertTrainerSql, [
      1,                    // id
      'Red',               // fname
      'Ketchum',           // lname
      1,                   // region_id (Kanto)
      '2020-04-01',        // birthdate
      1500.0,              // pwtr_rating
      1500.0,              // peak_rating
      1,                   // peak_rank
      1                    // active_status (true)
    ], (err) => {
      if (err) {
        console.error('Error inserting default trainer:', err);
        reject(err);
        return;
      }
      
      console.log('Inserted default trainer: Red Ketchum');
      resolve();
    });
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
    
    console.log('Populating default trainer...');
    await populateDefaultTrainer(db);
    
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
    
    console.log('Populating default trainer...');
    await populateDefaultTrainer(db);
    
    console.log('Default data population completed successfully!');
  } catch (error) {
    console.error('Error populating default data:', error);
    throw error;
  }
};
