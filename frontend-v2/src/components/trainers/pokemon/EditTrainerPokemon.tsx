import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Box, Typography, TextField, Button, MenuItem, CircularProgress } from '@mui/material';
import { Pokemon, PokemonSpecies, Nature } from '../../../types/pokemon';

interface TrainerPokemonData extends Pokemon {
    trainer_fname: string;
    trainer_lname: string;
}

// Utility function to compute final stats
function computeFinalStat(
    statName: string,
    base: number,
    iv: number,
    ev: number,
    level: number,
    natureMult: number
): number {
    const floorFn = Math.floor;

    if (statName.toLowerCase() === 'hp') {
        return floorFn(0.01 * (2 * base + iv + floorFn(0.25 * ev)) * level) + level + 10;
    } else {
        let tmp = floorFn(0.01 * (2 * base + iv + floorFn(0.25 * ev)) * level) + 5;
        tmp = Math.round(tmp * natureMult);
        return tmp;
    }
}

const fetchPokemonDetails = async (id: string) => {
    const response = await axios.get(`http://localhost:5000/pokemon/${id}`);
    return response.data.data;
};

const fetchPokemonSpecies = async (id: number) => {
    const response = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
    return response.data;
};

const fetchPokemonBaseStats = async (speciesId: number) => {
    const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${speciesId}`);
    return response.data;
};

const fetchNatures = async () => {
    const response = await axios.get('https://pokeapi.co/api/v2/nature');
    return response.data.results.map((nature: any, index: number) => ({
        id: index + 1,
        name: nature.name.charAt(0).toUpperCase() + nature.name.slice(1)
    }));
};

const fetchNatureInfo = async (natureId: number) => {
    const response = await axios.get(`https://pokeapi.co/api/v2/nature/${natureId}`);
    return response.data;
};

const EditTrainerPokemon: React.FC = () => {
    const queryClient = useQueryClient();
    const { id, pokemonId } = useParams<{ id: string; pokemonId: string }>();
    const navigate = useNavigate();

    const [formData, setFormData] = useState<Partial<Pokemon>>({});
    const [baseStatsArray, setBaseStatsArray] = useState<number[]>([0, 0, 0, 0, 0, 0]);
    const [natureMultipliers, setNatureMultipliers] = useState<number[]>([1, 1, 1, 1, 1, 1]);

    const { data: pokemon, isLoading: isPokemonLoading } = useQuery<TrainerPokemonData>({
        queryKey: ['pokemon', pokemonId],
        queryFn: () => fetchPokemonDetails(pokemonId!),
    });

    const { data: species, isLoading: isSpeciesLoading } = useQuery<PokemonSpecies>({
        queryKey: ['species', pokemon?.species_id],
        queryFn: () => fetchPokemonSpecies(pokemon!.species_id),
        enabled: !!pokemon?.species_id,
    });

    const { data: baseStats, isLoading: isBaseStatsLoading } = useQuery({
        queryKey: ['baseStats', pokemon?.species_id],
        queryFn: () => fetchPokemonBaseStats(pokemon!.species_id),
        enabled: !!pokemon?.species_id,
    });

    const { data: natures, isLoading: isNaturesLoading } = useQuery<Nature[]>({
        queryKey: ['natures'],
        queryFn: fetchNatures,
    });

    // Update base stats when species data changes
    useEffect(() => {
        if (baseStats) {
            const statsArr: number[] = [0, 0, 0, 0, 0, 0];
            baseStats.stats.forEach((s: any) => {
                const sname = s.stat.name;
                const sbase = s.base_stat;
                if (sname === 'hp') statsArr[0] = sbase;
                else if (sname === 'attack') statsArr[1] = sbase;
                else if (sname === 'defense') statsArr[2] = sbase;
                else if (sname === 'special-attack') statsArr[3] = sbase;
                else if (sname === 'special-defense') statsArr[4] = sbase;
                else if (sname === 'speed') statsArr[5] = sbase;
            });
            setBaseStatsArray(statsArr);
        }
    }, [baseStats]);

    // Update nature multipliers when nature changes
    useEffect(() => {
        if (formData.nature_id) {
            fetchNatureInfo(formData.nature_id)
                .then((natData) => {
                    const inc = natData?.increased_stat?.name || null;
                    const dec = natData?.decreased_stat?.name || null;
                    const defaultMults = [1, 1, 1, 1, 1, 1];

                    function statIndex(name: string) {
                        if (name === 'hp') return 0;
                        else if (name === 'attack') return 1;
                        else if (name === 'defense') return 2;
                        else if (name === 'special-attack') return 3;
                        else if (name === 'special-defense') return 4;
                        else if (name === 'speed') return 5;
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
                    setNatureMultipliers([1, 1, 1, 1, 1, 1]);
                });
        }
    }, [formData.nature_id]);

    // Recalculate stats when relevant values change
    useEffect(() => {
        const lvl = parseInt(formData.level?.toString() || '0', 10);
        if (!baseStatsArray.length || lvl <= 0) return;

        const ivs = [
            parseInt(formData.iv_hp?.toString() || '0', 10),
            parseInt(formData.iv_attack?.toString() || '0', 10),
            parseInt(formData.iv_defense?.toString() || '0', 10),
            parseInt(formData.iv_special_attack?.toString() || '0', 10),
            parseInt(formData.iv_special_defense?.toString() || '0', 10),
            parseInt(formData.iv_speed?.toString() || '0', 10),
        ];

        const evs = [
            parseInt(formData.ev_hp?.toString() || '0', 10),
            parseInt(formData.ev_attack?.toString() || '0', 10),
            parseInt(formData.ev_defense?.toString() || '0', 10),
            parseInt(formData.ev_special_attack?.toString() || '0', 10),
            parseInt(formData.ev_special_defense?.toString() || '0', 10),
            parseInt(formData.ev_speed?.toString() || '0', 10),
        ];

        const newHP = computeFinalStat('hp', baseStatsArray[0], ivs[0], evs[0], lvl, natureMultipliers[0]);
        const newAtk = computeFinalStat('attack', baseStatsArray[1], ivs[1], evs[1], lvl, natureMultipliers[1]);
        const newDef = computeFinalStat('defense', baseStatsArray[2], ivs[2], evs[2], lvl, natureMultipliers[2]);
        const newSpA = computeFinalStat('special-attack', baseStatsArray[3], ivs[3], evs[3], lvl, natureMultipliers[3]);
        const newSpD = computeFinalStat('special-defense', baseStatsArray[4], ivs[4], evs[4], lvl, natureMultipliers[4]);
        const newSpe = computeFinalStat('speed', baseStatsArray[5], ivs[5], evs[5], lvl, natureMultipliers[5]);

        setFormData(prev => ({
            ...prev,
            hp: newHP,
            attack: newAtk,
            defense: newDef,
            special_attack: newSpA,
            special_defense: newSpD,
            speed: newSpe,
        }));
    }, [
        baseStatsArray,
        natureMultipliers,
        formData.level,
        formData.iv_hp,
        formData.iv_attack,
        formData.iv_defense,
        formData.iv_special_attack,
        formData.iv_special_defense,
        formData.iv_speed,
        formData.ev_hp,
        formData.ev_attack,
        formData.ev_defense,
        formData.ev_special_attack,
        formData.ev_special_defense,
        formData.ev_speed,
    ]);

    const mutation = useMutation({
        mutationFn: async (updatedPokemon: Pokemon) => {
            const response = await axios.put(`http://localhost:5000/pokemon/${pokemonId}`, updatedPokemon);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pokemon', pokemonId] });
            navigate(`/trainers/${id}/pokemon/${pokemonId}`);
        },
    });

    useEffect(() => {
        if (pokemon) {
            setFormData(pokemon);
        }
    }, [pokemon]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData as Pokemon);
    };

    if (isPokemonLoading || isSpeciesLoading || isBaseStatsLoading || isNaturesLoading) {
        return (
            <Box className="!flex !justify-center !items-center !h-full">
                <Typography variant="h6" className="!text-white">
                    Loading...
                </Typography>
            </Box>
        );
    }

    if (!pokemon) {
        return (
            <Box className="!flex !justify-center !items-center !h-full">
                <Typography variant="h6" className="!text-white">
                    No Pokemon found
                </Typography>
            </Box>
        );
    }

    const trainerName = `${pokemon.trainer_fname} ${pokemon.trainer_lname}`;
    const pokemonName = pokemon.nickname || species?.name || 'Pokemon';

    return (
        <Box className="!p-6">
            <Typography variant="h5" className="!mb-6 !text-white">
                Edit {pokemonName} - {trainerName}
            </Typography>

            <form onSubmit={handleSubmit} className="!space-y-6">
                {/* Basic Info */}
                <Box className="!grid !grid-cols-1 md:!grid-cols-3 !gap-6">
                    <TextField
                        label="Species ID"
                        name="species_id"
                        type="number"
                        value={formData.species_id || ''}
                        onChange={handleChange}
                        fullWidth
                        className="!bg-gray-800"
                        slotProps={{
                            input: {
                                className: '!text-white',
                            },
                            inputLabel: {
                                className: '!text-gray-400',
                            },
                        }}
                    />
                    <TextField
                        label="Pokémon ID"
                        name="pokemon_id"
                        type="number"
                        value={formData.pokemon_id || ''}
                        onChange={handleChange}
                        fullWidth
                        className="!bg-gray-800"
                        slotProps={{
                            input: {
                                className: '!text-white',
                            },
                            inputLabel: {
                                className: '!text-gray-400',
                            },
                        }}
                    />
                    <TextField
                        label="Level"
                        name="level"
                        type="number"
                        value={formData.level || ''}
                        onChange={handleChange}
                        fullWidth
                        className="!bg-gray-800"
                        slotProps={{
                            input: {
                                className: '!text-white',
                            },
                            inputLabel: {
                                className: '!text-gray-400',
                            },
                        }}
                    />
                </Box>

                {/* OT Info */}
                <Box className="!grid !grid-cols-1 md:!grid-cols-3 !gap-6">
                    <TextField
                        label="OT Name"
                        name="ot_name"
                        value={formData.ot_name || ''}
                        onChange={handleChange}
                        fullWidth
                        className="!bg-gray-800"
                        slotProps={{
                            input: {
                                className: '!text-white',
                            },
                            inputLabel: {
                                className: '!text-gray-400',
                            },
                        }}
                    />
                    <TextField
                        label="OT ID"
                        name="ot_id"
                        type="number"
                        value={formData.ot_id || ''}
                        onChange={handleChange}
                        fullWidth
                        className="!bg-gray-800"
                        slotProps={{
                            input: {
                                className: '!text-white',
                            },
                            inputLabel: {
                                className: '!text-gray-400',
                            },
                        }}
                    />
                    <TextField
                        label="Nickname"
                        name="nickname"
                        value={formData.nickname || ''}
                        onChange={handleChange}
                        fullWidth
                        className="!bg-gray-800"
                        slotProps={{
                            input: {
                                className: '!text-white',
                            },
                            inputLabel: {
                                className: '!text-gray-400',
                            },
                        }}
                    />
                </Box>

                {/* IVs */}
                <Typography variant="h6" className="!text-white !mt-8 !mb-4">
                    Individual Values (IVs)
                </Typography>
                <Box className="!grid !grid-cols-1 md:!grid-cols-2 !gap-6">
                    {['hp', 'attack', 'defense', 'special_attack', 'special_defense', 'speed'].map((stat) => (
                        <TextField
                            key={`iv_${stat}`}
                            label={`${stat.charAt(0).toUpperCase() + stat.slice(1)} IV`}
                            name={`iv_${stat}`}
                            type="number"
                            value={formData[`iv_${stat}` as keyof Pokemon] || ''}
                            onChange={handleChange}
                            fullWidth
                            className="!bg-gray-800"
                            slotProps={{
                                input: {
                                    className: '!text-white',
                                },
                                inputLabel: {
                                    className: '!text-gray-400',
                                },
                            }}
                        />
                    ))}
                </Box>

                {/* EVs */}
                <Typography variant="h6" className="!text-white !mt-8 !mb-4">
                    Effort Values (EVs)
                </Typography>
                <Box className="!grid !grid-cols-1 md:!grid-cols-2 !gap-6">
                    {['hp', 'attack', 'defense', 'special_attack', 'special_defense', 'speed'].map((stat) => (
                        <TextField
                            key={`ev_${stat}`}
                            label={`${stat.charAt(0).toUpperCase() + stat.slice(1)} EV`}
                            name={`ev_${stat}`}
                            type="number"
                            value={formData[`ev_${stat}` as keyof Pokemon] || ''}
                            onChange={handleChange}
                            fullWidth
                            className="!bg-gray-800"
                            slotProps={{
                                input: {
                                    className: '!text-white',
                                },
                                inputLabel: {
                                    className: '!text-gray-400',
                                },
                            }}
                        />
                    ))}
                </Box>

                {/* Nature, Ability, etc. */}
                <Box className="!grid !grid-cols-1 md:!grid-cols-3 !gap-6">
                    <TextField
                        select
                        label="Nature"
                        name="nature_id"
                        value={formData.nature_id || ''}
                        onChange={handleChange}
                        fullWidth
                        className="!bg-gray-800"
                        slotProps={{
                            input: {
                                className: '!text-white',
                            },
                            inputLabel: {
                                className: '!text-gray-400',
                            },
                        }}
                    >
                        <MenuItem value="">
                            <em>Select Nature</em>
                        </MenuItem>
                        {Array.isArray(natures) && natures.map((nature: any) => (
                            <MenuItem key={nature.id} value={nature.id} className="!text-white">
                                {nature.name}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        label="Ability ID"
                        name="ability_id"
                        type="number"
                        value={formData.ability_id || ''}
                        onChange={handleChange}
                        fullWidth
                        className="!bg-gray-800"
                        slotProps={{
                            input: {
                                className: '!text-white',
                            },
                            inputLabel: {
                                className: '!text-gray-400',
                            },
                        }}
                    />
                    <TextField
                        label="Gender"
                        name="gender"
                        value={formData.gender || ''}
                        onChange={handleChange}
                        fullWidth
                        className="!bg-gray-800"
                        slotProps={{
                            input: {
                                className: '!text-white',
                            },
                            inputLabel: {
                                className: '!text-gray-400',
                            },
                        }}
                    />
                </Box>

                {/* Met Info */}
                <Box className="!grid !grid-cols-1 md:!grid-cols-3 !gap-6">
                    <TextField
                        label="Date Met At"
                        name="date_met_at"
                        value={formData.date_met_at || ''}
                        onChange={handleChange}
                        fullWidth
                        className="!bg-gray-800"
                        slotProps={{
                            input: {
                                className: '!text-white',
                            },
                            inputLabel: {
                                className: '!text-gray-400',
                            },
                        }}
                    />
                    <TextField
                        label="Location Met At"
                        name="location_met_at"
                        value={formData.location_met_at || ''}
                        onChange={handleChange}
                        fullWidth
                        className="!bg-gray-800"
                        slotProps={{
                            input: {
                                className: '!text-white',
                            },
                            inputLabel: {
                                className: '!text-gray-400',
                            },
                        }}
                    />
                    <TextField
                        label="Level Met At"
                        name="level_met_at"
                        type="number"
                        value={formData.level_met_at || ''}
                        onChange={handleChange}
                        fullWidth
                        className="!bg-gray-800"
                        slotProps={{
                            input: {
                                className: '!text-white',
                            },
                            inputLabel: {
                                className: '!text-gray-400',
                            },
                        }}
                    />
                </Box>

                <Box className="!flex !justify-end !mt-8">
                    <Button
                        type="submit"
                        variant="contained"
                        className="!bg-sky-300 hover:!bg-sky-400"
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                </Box>
            </form>
        </Box>
    );
};

export default EditTrainerPokemon; 