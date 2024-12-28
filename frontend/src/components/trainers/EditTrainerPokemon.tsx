import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Container, Row, Col, Form, Button, Dropdown } from 'react-bootstrap';

////////////////////////////////////////////////////////////////////////////////
// 1) UTILITY FUNCTIONS
////////////////////////////////////////////////////////////////////////////////

// 1a) Compute final stats
function computeFinalStat(
  statName: string,
  base: number,
  iv: number,
  ev: number,
  level: number,
  natureMult: number
): number {
  // HP formula:
  // HP = floor(0.01 * (2*base + iv + floor(0.25*ev)) * level) + level + 10
  // Else:
  // otherStat = floor(0.01 * (2*base + iv + floor(0.25*ev)) * level) + 5
  // then * natureMult
  const floorFn = Math.floor;

  if (statName.toLowerCase() === 'hp') {
    const tmp =
      floorFn(
        0.01 * (2 * base + iv + floorFn(0.25 * ev)) * level
      ) + level + 10;
    return tmp;
  } else {
    let tmp =
      floorFn(
        0.01 * (2 * base + iv + floorFn(0.25 * ev)) * level
      ) + 5;
    tmp = Math.round(tmp * natureMult);
    return tmp;
  }
}

// 1b) Example exponential happiness function
function computeExponentialHappiness(dateMet: string): number {
  // If you want to do something fancy with dateMet, do so. 
  // For demonstration: random [100..255], skewed to higher values.
  const minH = 100;
  const maxH = 255;

  const expVal = Math.random(); // uniform [0..1]
  const skewed = expVal ** 2;   // skew to high end
  const val = Math.floor(minH + (maxH - minH) * skewed);
  return Math.min(maxH, Math.max(minH, val));
}

// 1c) Fetch single Pokémon from your backend
async function fetchPokemon(pokemonId: string) {
  const { data } = await axios.get(`http://localhost:5000/pokemon/${pokemonId}`);
  return data.data; // { ...pokemonData }
}

// 1d) Update Pokémon in your backend
async function updatePokemon({
  pokemonId,
  updatedPokemon,
}: {
  pokemonId: string;
  updatedPokemon: any;
}) {
  const { data } = await axios.put(
    `http://localhost:5000/pokemon/${pokemonId}`,
    updatedPokemon
  );
  return data;
}

// 1e) Fetch base stats from the PokeAPI
async function fetchPokemonBaseStats(speciesId: string) {
  // e.g. https://pokeapi.co/api/v2/pokemon/10081/
  const resp = await axios.get(`https://pokeapi.co/api/v2/pokemon/${speciesId}`);
  return resp.data; // includes "stats": [...]
}

// 1f) Fetch nature info from the PokeAPI
async function fetchNatureInfo(natureId: string) {
  // e.g. https://pokeapi.co/api/v2/nature/3
  const resp = await axios.get(`https://pokeapi.co/api/v2/nature/${natureId}`);
  return resp.data; // includes "increased_stat", "decreased_stat"
}

////////////////////////////////////////////////////////////////////////////////
// 2) COMPONENT
////////////////////////////////////////////////////////////////////////////////

const EditTrainerPokemon: React.FC = () => {
  const queryClient = useQueryClient();
  const { id, pokemonId } = useParams<{ id: string; pokemonId: string }>();
  const navigate = useNavigate();

  // 2a) Load the existing Pokémon from your backend
  const {
    data: pokemonData,
    isLoading,
  } = useQuery({
    queryKey: ['pokemon', pokemonId],
    queryFn: () => fetchPokemon(pokemonId!),
  });

  // 2b) Mutation for saving, with force-refetch
  const mutation = useMutation({
    mutationFn: updatePokemon,
    onSuccess: () => {
      // Invalidate the React Query cache for this Pokémon
      queryClient.invalidateQueries({
        queryKey: ['pokemon', pokemonId] as const,
      });
      
      if (pokemonData?.trainer_id) {
        navigate(`/trainers/${pokemonData.trainer_id}/pokemon/${pokemonId}`);
      }
    },
    onError: (error) => {
      alert('Error updating Pokémon');
      console.error(error);
    },
  });

  // 2c) local form state
  const [formState, setFormState] = useState<any>({
    trainer_id: '',
    species_id: '',
    pokemon_id: '',
    level: '',
    ot_name: '',
    ot_id: '',
    nickname: '',
    attack: '',
    defense: '',
    special_attack: '',
    special_defense: '',
    speed: '',
    hp: '',
    happiness: '',
    iv_hp: '',
    iv_attack: '',
    iv_defense: '',
    iv_special_attack: '',
    iv_special_defense: '',
    iv_speed: '',
    ev_hp: '',
    ev_attack: '',
    ev_defense: '',
    ev_special_attack: '',
    ev_special_defense: '',
    ev_speed: '',
    nature_id: '',
    ability_id: '',
    gender: '',
    shiny: false,
    pokeball_id: '',
    held_item_id: '',
    experience_points: '',
    is_gigantamax: false,
    is_mega: false,
    date_met_at: '',
    location_met_at: '',
    level_met_at: '',
    current_hp: '',
    current_strength: '',
    status_id: '',
    battles_won: '',
    battles_lost: '',
    kills: '',
    deaths: '',
    training_efficiency: '',
  });

  // 2d) We'll store the base stats from PokeAPI
  const [baseStats, setBaseStats] = useState<number[]>([]); // [hp, atk, def, spa, spd, spe]
  // 2e) We'll store the nature multipliers
  const [natureMultipliers, setNatureMultipliers] = useState<number[]>([1,1,1,1,1,1]);

  // 2f) On load or on data changes, always sync the form with backend data
  useEffect(() => {
    if (!isLoading && pokemonData) {
      // debug:
      // console.log('Fetched Pokémon data:', pokemonData);

      setFormState((prev: any) => ({
        ...prev,
        ...pokemonData,
      }));
    }
  }, [isLoading, pokemonData]);

  // 2g) Whenever species_id changes, fetch base stats
  useEffect(() => {
    if (formState.species_id) {
      fetchPokemonBaseStats(formState.species_id)
        .then((resp) => {
          const statsArr: number[] = [0, 0, 0, 0, 0, 0];
          resp.stats.forEach((s: any) => {
            const sname = s.stat.name;
            const sbase = s.base_stat;
            if      (sname === 'hp')             statsArr[0] = sbase;
            else if (sname === 'attack')         statsArr[1] = sbase;
            else if (sname === 'defense')        statsArr[2] = sbase;
            else if (sname === 'special-attack') statsArr[3] = sbase;
            else if (sname === 'special-defense')statsArr[4] = sbase;
            else if (sname === 'speed')          statsArr[5] = sbase;
          });
          setBaseStats(statsArr);
        })
        .catch((err) => {
          console.error('Failed to fetch base stats:', err);
          setBaseStats([0,0,0,0,0,0]);
        });
    }
  }, [formState.species_id]);

  // 2h) Whenever nature_id changes, fetch nature info
  useEffect(() => {
    if (formState.nature_id) {
      fetchNatureInfo(formState.nature_id)
        .then((natData) => {
          const inc = natData?.increased_stat?.name || null;
          const dec = natData?.decreased_stat?.name || null;
          const defaultMults = [1,1,1,1,1,1];

          function statIndex(name: string) {
            if      (name === 'hp')               return 0;
            else if (name === 'attack')           return 1;
            else if (name === 'defense')          return 2;
            else if (name === 'special-attack')   return 3;
            else if (name === 'special-defense')  return 4;
            else if (name === 'speed')            return 5;
            return -1;
          }

          if (inc) {
            const i = statIndex(inc);
            if (i >= 0) defaultMults[i] = 1.1;
          }
          if (dec) {
            const i = statIndex(dec);
            if (i >= 0) defaultMults[i] = 0.9;
          }
          setNatureMultipliers(defaultMults);
        })
        .catch((err) => {
          console.error('Failed to fetch nature info:', err);
          setNatureMultipliers([1,1,1,1,1,1]);
        });
    }
  }, [formState.nature_id]);

  // 2i) Recompute final stats whenever relevant form fields change
  useEffect(() => {
    const lvl = parseInt(formState.level || '0', 10);
    if (!baseStats.length || lvl <= 0) {
      return;
    }

    // parse IVs
    const ivs = [
      parseInt(formState.iv_hp || '0', 10),
      parseInt(formState.iv_attack || '0', 10),
      parseInt(formState.iv_defense || '0', 10),
      parseInt(formState.iv_special_attack || '0', 10),
      parseInt(formState.iv_special_defense || '0', 10),
      parseInt(formState.iv_speed || '0', 10),
    ];
    // parse EVs
    const evs = [
      parseInt(formState.ev_hp || '0', 10),
      parseInt(formState.ev_attack || '0', 10),
      parseInt(formState.ev_defense || '0', 10),
      parseInt(formState.ev_special_attack || '0', 10),
      parseInt(formState.ev_special_defense || '0', 10),
      parseInt(formState.ev_speed || '0', 10),
    ];

    // compute final stats
    const newHP = computeFinalStat('hp', baseStats[0], ivs[0], evs[0], lvl, natureMultipliers[0]);
    const newAtk = computeFinalStat('attack', baseStats[1], ivs[1], evs[1], lvl, natureMultipliers[1]);
    const newDef = computeFinalStat('defense', baseStats[2], ivs[2], evs[2], lvl, natureMultipliers[2]);
    const newSpA = computeFinalStat('special-attack', baseStats[3], ivs[3], evs[3], lvl, natureMultipliers[3]);
    const newSpD = computeFinalStat('special-defense', baseStats[4], ivs[4], evs[4], lvl, natureMultipliers[4]);
    const newSpe = computeFinalStat('speed', baseStats[5], ivs[5], evs[5], lvl, natureMultipliers[5]);

    setFormState((prev: any) => ({
      ...prev,
      hp: newHP,
      attack: newAtk,
      defense: newDef,
      special_attack: newSpA,
      special_defense: newSpD,
      speed: newSpe,
    }));
  }, [
    baseStats,
    natureMultipliers,
    formState.level,
    formState.iv_hp,
    formState.iv_attack,
    formState.iv_defense,
    formState.iv_special_attack,
    formState.iv_special_defense,
    formState.iv_speed,
    formState.ev_hp,
    formState.ev_attack,
    formState.ev_defense,
    formState.ev_special_attack,
    formState.ev_special_defense,
    formState.ev_speed,
  ]);

  // 2j) Also compute "happiness" each time the user changes 'date_met_at' or if 0
  useEffect(() => {
    if (!formState.date_met_at) return;
    if (!formState.happiness || parseInt(formState.happiness, 10) === 0) {
      const newHapp = computeExponentialHappiness(formState.date_met_at);
      setFormState((prev: any) => ({
        ...prev,
        happiness: newHapp,
      }));
    }
  }, [formState.date_met_at, formState.happiness]);

  // 2k) Handler: Save changes
  const handleSave = () => {
    // debug:
    // console.log('Saving with formState:', formState);
    mutation.mutate({ pokemonId: pokemonId!, updatedPokemon: formState });
  };

  // 2l) Handler: text input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev: any) => ({ ...prev, [name]: value }));
  };

  // 2m) Handler: checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormState((prev: any) => ({ ...prev, [name]: checked }));
  };

  if (isLoading) return <div>Loading...</div>;
  if (!pokemonData) return <div>No Data Found</div>;

  // 3) RENDER
  return (
    <Container className="mt-4">
      <Row className="align-items-center mb-3">
        <Col>
          <h1>Edit Pokémon - {formState.nickname || formState.species_id}</h1>
        </Col>
        <Col xs="auto" className="text-end">
          <Dropdown className="float-end">
            <Dropdown.Toggle variant="secondary" id="dropdown-basic">
              Edit
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item as={Link} to={`/trainers/${pokemonData.trainer_id}/pokemon/${pokemonId}`}>
                Overview
              </Dropdown.Item>
              <Dropdown.Item as={Link} to={`/trainer/${pokemonData.trainer_id}/edit_pokemon/${pokemonId}`}>
                Edit
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>

      <Form>
        {/* Basic Info */}
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Species ID</Form.Label>
              <Form.Control
                type="number"
                name="species_id"
                value={formState.species_id}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Pokémon ID</Form.Label>
              <Form.Control
                type="number"
                name="pokemon_id"
                value={formState.pokemon_id}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Level</Form.Label>
              <Form.Control
                type="number"
                name="level"
                value={formState.level}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
        </Row>

        {/* OT Info */}
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>OT Name</Form.Label>
              <Form.Control
                type="text"
                name="ot_name"
                value={formState.ot_name}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>OT ID</Form.Label>
              <Form.Control
                type="number"
                name="ot_id"
                value={formState.ot_id}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Nickname</Form.Label>
              <Form.Control
                type="text"
                name="nickname"
                value={formState.nickname}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
        </Row>

        {/* Stats that we auto-update */}
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Attack</Form.Label>
              <Form.Control
                type="number"
                name="attack"
                value={formState.attack}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Defense</Form.Label>
              <Form.Control
                type="number"
                name="defense"
                value={formState.defense}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Special Attack</Form.Label>
              <Form.Control
                type="number"
                name="special_attack"
                value={formState.special_attack}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Special Defense</Form.Label>
              <Form.Control
                type="number"
                name="special_defense"
                value={formState.special_defense}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Speed</Form.Label>
              <Form.Control
                type="number"
                name="speed"
                value={formState.speed}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>HP</Form.Label>
              <Form.Control
                type="number"
                name="hp"
                value={formState.hp}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
        </Row>

        {/* IVs/EVs */}
        <Row>
          <Col md={6}>
            <h5>IVs</h5>
            <Form.Group className="mb-3">
              <Form.Label>HP IV</Form.Label>
              <Form.Control
                type="number"
                name="iv_hp"
                value={formState.iv_hp}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Attack IV</Form.Label>
              <Form.Control
                type="number"
                name="iv_attack"
                value={formState.iv_attack}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Defense IV</Form.Label>
              <Form.Control
                type="number"
                name="iv_defense"
                value={formState.iv_defense}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Special Attack IV</Form.Label>
              <Form.Control
                type="number"
                name="iv_special_attack"
                value={formState.iv_special_attack}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Special Defense IV</Form.Label>
              <Form.Control
                type="number"
                name="iv_special_defense"
                value={formState.iv_special_defense}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Speed IV</Form.Label>
              <Form.Control
                type="number"
                name="iv_speed"
                value={formState.iv_speed}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <h5>EVs</h5>
            <Form.Group className="mb-3">
              <Form.Label>HP EV</Form.Label>
              <Form.Control
                type="number"
                name="ev_hp"
                value={formState.ev_hp}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Attack EV</Form.Label>
              <Form.Control
                type="number"
                name="ev_attack"
                value={formState.ev_attack}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Defense EV</Form.Label>
              <Form.Control
                type="number"
                name="ev_defense"
                value={formState.ev_defense}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Special Attack EV</Form.Label>
              <Form.Control
                type="number"
                name="ev_special_attack"
                value={formState.ev_special_attack}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Special Defense EV</Form.Label>
              <Form.Control
                type="number"
                name="ev_special_defense"
                value={formState.ev_special_defense}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Speed EV</Form.Label>
              <Form.Control
                type="number"
                name="ev_speed"
                value={formState.ev_speed}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
        </Row>

        {/* Nature, ability, etc. */}
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Nature ID</Form.Label>
              <Form.Control
                type="number"
                name="nature_id"
                value={formState.nature_id}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Ability ID</Form.Label>
              <Form.Control
                type="number"
                name="ability_id"
                value={formState.ability_id}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Gender</Form.Label>
              <Form.Control
                type="text"
                name="gender"
                value={formState.gender}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={4}>
            <Form.Check
              type="checkbox"
              label="Shiny"
              name="shiny"
              checked={formState.shiny}
              onChange={handleCheckboxChange}
            />
          </Col>
          <Col md={4}>
            <Form.Check
              type="checkbox"
              label="Gigantamax"
              name="is_gigantamax"
              checked={formState.is_gigantamax}
              onChange={handleCheckboxChange}
            />
          </Col>
          <Col md={4}>
            <Form.Check
              type="checkbox"
              label="Mega"
              name="is_mega"
              checked={formState.is_mega}
              onChange={handleCheckboxChange}
            />
          </Col>
        </Row>

        {/* Met Info */}
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Date Met At</Form.Label>
              <Form.Control
                type="text"
                name="date_met_at"
                value={formState.date_met_at}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Location Met At</Form.Label>
              <Form.Control
                type="text"
                name="location_met_at"
                value={formState.location_met_at}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Level Met At</Form.Label>
              <Form.Control
                type="number"
                name="level_met_at"
                value={formState.level_met_at}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
        </Row>

        {/* Additional Stats */}
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Current HP</Form.Label>
              <Form.Control
                type="number"
                name="current_hp"
                value={formState.current_hp}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Current Strength</Form.Label>
              <Form.Control
                type="number"
                name="current_strength"
                value={formState.current_strength}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Status ID</Form.Label>
              <Form.Control
                type="number"
                name="status_id"
                value={formState.status_id}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
        </Row>

        {/* Battle Stats */}
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Battles Won</Form.Label>
              <Form.Control
                type="number"
                name="battles_won"
                value={formState.battles_won}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Battles Lost</Form.Label>
              <Form.Control
                type="number"
                name="battles_lost"
                value={formState.battles_lost}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Kills</Form.Label>
              <Form.Control
                type="number"
                name="kills"
                value={formState.kills}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Deaths</Form.Label>
              <Form.Control
                type="number"
                name="deaths"
                value={formState.deaths}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
        </Row>

        {/* Training */}
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Training Efficiency</Form.Label>
              <Form.Control
                type="number"
                name="training_efficiency"
                value={formState.training_efficiency}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
        </Row>

        {/* Happiness */}
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Happiness</Form.Label>
              <Form.Control
                type="number"
                name="happiness"
                value={formState.happiness}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
        </Row>

        <Button variant="primary" onClick={handleSave}>
          Save
        </Button>
      </Form>
    </Container>
  );
};

export default EditTrainerPokemon;
