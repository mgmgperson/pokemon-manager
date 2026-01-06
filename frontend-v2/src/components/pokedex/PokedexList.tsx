import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    Box,
    Typography,
    CircularProgress,
    Paper,
    Pagination,
    TextField,
    Button,
} from '@mui/material';
import axios from 'axios';
import { PokemonEntity } from '../../types/pokedex';
import TypeBadge from '../TypeBadge';

const fetchAllPokemon = async (): Promise<PokemonEntity[]> => {
    const { data } = await axios.get('http://localhost:5000/pokemon-entity');
    return data.data;
};

const POKEMON_PER_PAGE = 24; // 6 columns x 4 rows

const PokedexList: React.FC = () => {
    const [page, setPage] = useState(1);
    const [pageInput, setPageInput] = useState('');

    const { data: allPokemon, isLoading, error } = useQuery({
        queryKey: ['pokemon-all'],
        queryFn: fetchAllPokemon,
    });

    if (isLoading) {
        return (
            <Box className="flex justify-center items-center h-full">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box className="flex justify-center items-center h-full">
                <Typography color="error">Error loading Pokedex data.</Typography>
            </Box>
        );
    }

    // Filter to only default forms (isDefault === true) to show one per species
    const defaultPokemon = allPokemon?.filter(p => p.is_default) || [];

    const totalPages = Math.ceil(defaultPokemon.length / POKEMON_PER_PAGE);
    const startIndex = (page - 1) * POKEMON_PER_PAGE;
    const endIndex = startIndex + POKEMON_PER_PAGE;
    const currentPokemon = defaultPokemon.slice(startIndex, endIndex);

    const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePageJump = () => {
        const pageNumber = parseInt(pageInput);
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setPage(pageNumber);
            setPageInput('');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePageInputKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handlePageJump();
        }
    };

    return (
        <Box className="p-6">
            <Paper className="p-6 mb-6">
                <Box className="flex justify-between items-center mb-4">
                    <Typography variant="h4" className="text-white">
                        Pokédex
                    </Typography>
                    <Typography variant="body1" className="text-gray-400">
                        {defaultPokemon.length} Pokémon
                    </Typography>
                </Box>

                <Box className="mb-6 flex justify-center items-center gap-4">
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                        size="large"
                        showFirstButton
                        showLastButton
                    />
                    <Box className="flex items-center gap-2">
                        <TextField
                            size="small"
                            placeholder="Page"
                            value={pageInput}
                            onChange={(e) => setPageInput(e.target.value)}
                            onKeyPress={handlePageInputKeyPress}
                            type="number"
                            inputProps={{ min: 1, max: totalPages }}
                            sx={{
                                width: '80px',
                                '& .MuiInputBase-input': { color: 'white' },
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': { borderColor: 'gray' },
                                    '&:hover fieldset': { borderColor: 'lightgray' },
                                },
                            }}
                        />
                        <Button
                            variant="contained"
                            onClick={handlePageJump}
                            size="small"
                            className="!bg-blue-600 hover:!bg-blue-700"
                        >
                            Go
                        </Button>
                    </Box>
                </Box>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {currentPokemon.map((pokemon) => (
                        <Link
                            key={pokemon.id}
                            to={`/pokedex/pokemon/${pokemon.id}`}
                            className="no-underline"
                        >
                            <Paper className="p-4 bg-gray-800 hover:bg-gray-700 transition-colors h-full">
                                <Box className="flex flex-col items-center">
                                    <Typography
                                        variant="caption"
                                        className="text-gray-500 font-mono mb-2"
                                    >
                                        #{pokemon.id.toString().padStart(4, '0')}
                                    </Typography>
                                    <img
                                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
                                        alt={pokemon.name}
                                        className="w-24 h-24 object-contain mb-2"
                                    />
                                    <Typography
                                        variant="h6"
                                        className="text-white text-center mb-2 capitalize"
                                    >
                                        {pokemon.name}
                                    </Typography>
                                    <Box className="flex gap-1 flex-wrap justify-center">
                                        {pokemon.types.map((type, index) => (
                                            <TypeBadge key={index} type={type} />
                                        ))}
                                    </Box>
                                </Box>
                            </Paper>
                        </Link>
                    ))}
                </div>

                <Box className="mt-6 flex justify-center items-center gap-4">
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                        size="large"
                        showFirstButton
                        showLastButton
                    />
                    <Box className="flex items-center gap-2">
                        <TextField
                            size="small"
                            placeholder="Page"
                            value={pageInput}
                            onChange={(e) => setPageInput(e.target.value)}
                            onKeyPress={handlePageInputKeyPress}
                            type="number"
                            inputProps={{ min: 1, max: totalPages }}
                            sx={{
                                width: '80px',
                                '& .MuiInputBase-input': { color: 'white' },
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': { borderColor: 'gray' },
                                    '&:hover fieldset': { borderColor: 'lightgray' },
                                },
                            }}
                        />
                        <Button
                            variant="contained"
                            onClick={handlePageJump}
                            size="small"
                            className="!bg-blue-600 hover:!bg-blue-700"
                        >
                            Go
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};

export default PokedexList;
