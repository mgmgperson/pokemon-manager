import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  CardActionArea,
  Avatar,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Map as MapIcon,
  CatchingPokemon as CatchIcon,
  Hotel as RestIcon,
  Navigation as TravelIcon,
} from '@mui/icons-material';
import { GameState } from '../../types/gamestate';
import { Region } from '../../types/region';
import { Pokemon, PokemonEntity } from '../../types/pokemon';
import { Location } from '../../types/location';
import { TrainerAround, NextEvent } from '../../types/home';

const fetchGameState = async (): Promise<GameState> => {
  const response = await axios.get('http://localhost:5000/game_state/home');
  return response.data.data;
};

const fetchRegion = async (regionId: number): Promise<Region> => {
  const response = await axios.get(`http://localhost:5000/regions/${regionId}`);
  return response.data.data;
};

const fetchTrainerPokemon = async (trainerId: number): Promise<Pokemon[]> => {
  const response = await axios.get(`http://localhost:5000/trainers/${trainerId}/pokemon`);
  return response.data.data;
};

const fetchPokemonEntity = async (pokemonId: number): Promise<PokemonEntity> => {
  const response = await axios.get(`http://localhost:5000/pokemon-entity/${pokemonId}`);
  return response.data.data;
};

const fetchLocation = async (locationId: number): Promise<Location> => {
  const response = await axios.get(`http://localhost:5000/locations/${locationId}`);
  return response.data.data;
};

const fetchTrainersAround = async (_locationId: number): Promise<TrainerAround[]> => {
  // This will be a placeholder for now since the API doesn't exist yet
  const mockTrainers: TrainerAround[] = [
    {
      id: 1,
      fname: "Red",
      lname: "",
      title: "Champion of Kanto",
      pwtr_rating: 2800,
      region_name: "Kanto"
    },
    {
      id: 2, 
      fname: "Blue",
      lname: "",
      title: "Gym Leader of Viridian City",
      pwtr_rating: 2650,
      region_name: "Kanto"
    },
    {
      id: 3,
      fname: "Brock",
      lname: "",
      title: "Gym Leader of Pewter City",
      pwtr_rating: 2200,
      region_name: "Kanto"
    }
  ];
  return Promise.resolve(mockTrainers);
};

const fetchNextEvents = async (_trainerId: number): Promise<NextEvent[]> => {
  // This will be a placeholder for now since the API doesn't exist yet
  const mockEvents: NextEvent[] = [
    {
      id: 1,
      title: "Kanto Conference",
      date: "2025-09-15",
      type: "tournament",
      description: "Annual regional tournament"
    },
    {
      id: 2,
      title: "Elite Four Challenge",
      date: "2025-08-30", 
      type: "battle",
      description: "Challenge the Elite Four"
    }
  ];
  return Promise.resolve(mockEvents);
};

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [pokemonEntities, setPokemonEntities] = useState<Record<number, PokemonEntity>>({});
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  const { data: gameState, isLoading: gameStateLoading } = useQuery<GameState>({
    queryKey: ['gameState'],
    queryFn: fetchGameState,
  });

  const { data: region, isLoading: regionLoading } = useQuery<Region>({
    queryKey: ['region', gameState?.region_name],
    queryFn: () => {
      // Find region by name - this is a workaround since we don't have region_id in gameState
      // For now, assume it's Kanto (region ID 1)
      return fetchRegion(1);
    },
    enabled: !!gameState,
  });

  const { data: currentLocation } = useQuery<Location>({
    queryKey: ['location', gameState?.active_location_id],
    queryFn: () => fetchLocation(gameState!.active_location_id),
    enabled: !!gameState?.active_location_id,
  });

  const { data: pokemon, isLoading: pokemonLoading } = useQuery<Pokemon[]>({
    queryKey: ['trainerPokemon', gameState?.active_trainer_id],
    queryFn: () => fetchTrainerPokemon(gameState!.active_trainer_id),
    enabled: !!gameState?.active_trainer_id,
  });

  const { data: trainersAround, isLoading: trainersAroundLoading } = useQuery<TrainerAround[]>({
    queryKey: ['trainersAround', gameState?.active_location_id],
    queryFn: () => fetchTrainersAround(gameState!.active_location_id || 1),
    enabled: !!gameState,
  });

  const { data: nextEvents, isLoading: nextEventsLoading } = useQuery<NextEvent[]>({
    queryKey: ['nextEvents', gameState?.active_trainer_id],
    queryFn: () => fetchNextEvents(gameState!.active_trainer_id),
    enabled: !!gameState?.active_trainer_id,
  });

  // Fetch pokemon entities for each pokemon
  useEffect(() => {
    if (pokemon) {
      const fetchEntities = async () => {
        const entities: Record<number, PokemonEntity> = {};
        
        for (const p of pokemon) {
          if (p.species_id && !entities[p.species_id]) {
            try {
              const entity = await fetchPokemonEntity(p.species_id);
              entities[p.species_id] = entity;
            } catch (error) {
              console.error(`Failed to fetch entity for species ${p.species_id}:`, error);
            }
          }
        }
        
        setPokemonEntities(entities);
      };

      fetchEntities();
    }
  }, [pokemon]);

  const handlePokemonClick = (pokemonId: number) => {
    if (gameState) {
      navigate(`/trainers/${gameState.active_trainer_id}/pokemon/${pokemonId}`);
    }
  };

  const handleLocationClick = () => {
    if (gameState && gameState.active_location_id) {
      navigate(`/locations/${gameState.active_location_id}`);
    }
  };

  const handleTrainerClick = (trainerId: number) => {
    navigate(`/trainers/${trainerId}`);
  };

  if (gameStateLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography variant="h6" className="text-white">
          Loading...
        </Typography>
      </Box>
    );
  }

  if (!gameState) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography variant="h6" className="text-white">
          No active game state found
        </Typography>
      </Box>
    );
  }

  const trainerName = `${gameState.trainer_fname} ${gameState.trainer_lname}`;
  const currentTime = `${gameState.current_date} ${gameState.current_time}`;
  
  // Sort pokemon by level (descending) and take first 30 for display
  const sortedPokemon = pokemon ? [...pokemon].sort((a, b) => b.level - a.level).slice(0, 30) : [];

  return (
    <Box className="p-6">
      {/* Header */}
      <Paper className="p-6 bg-gray-800 mb-6">
        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems="center" gap={3}>
          <Box flex={1}>
            <Typography variant="h4" className="text-white mb-2">
              {trainerName}
            </Typography>
          </Box>
          <Box flex={1}>
            <Box display="flex" alignItems="center" className="text-gray-400 mb-1">
              <LocationIcon className="mr-2" />
              <Typography variant="body1">
                {gameState.location_name}, {gameState.region_name}
              </Typography>
            </Box>
          </Box>
          <Box flex={1}>
            <Box display="flex" alignItems="center" className="text-gray-400">
              <TimeIcon className="mr-2" />
              <Typography variant="body1">
                {currentTime}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      <Box display="flex" flexDirection={{ xs: 'column', lg: 'row' }} gap={4}>
        {/* Left Column */}
        <Box flex={1}>
          {/* Location Map */}
          <Paper className="p-4 bg-gray-800 mb-4">
            <Typography variant="h6" className="text-white mb-4" gutterBottom>
              <MapIcon className="mr-2" />
              Current Location
            </Typography>
            {!regionLoading && region ? (
              <Box className="relative">
                <Box 
                  className="relative cursor-pointer"
                  onClick={handleLocationClick}
                  sx={{ 
                    '&:hover': { 
                      opacity: 0.8,
                      transition: 'opacity 0.2s ease-in-out'
                    }
                  }}
                >
                  <img 
                    src={`/regions/${region.name.toLowerCase()}.png`} 
                    alt={`${region.name} map`} 
                    className="w-full rounded"
                    style={{ maxHeight: '400px', objectFit: 'contain' }}
                    onLoad={(e) => {
                      const img = e.target as HTMLImageElement;
                      setImageDimensions({
                        width: img.offsetWidth,
                        height: img.offsetHeight
                      });
                    }}
                  />
                  
                  {/* Location Polygon Highlight */}
                  {currentLocation && imageDimensions && (
                    <svg
                      className="absolute top-0 left-0 pointer-events-none"
                      width={imageDimensions.width}
                      height={imageDimensions.height}
                      viewBox={`0 0 ${imageDimensions.width} ${imageDimensions.height}`}
                    >
                      {(() => {
                        try {
                          const coordinates = JSON.parse(currentLocation.area_coordinates) as number[][];
                          if (coordinates && coordinates.length > 0) {
                            return (
                              <polygon
                                points={coordinates
                                  .map(([y, x]) => `${x * imageDimensions.width},${(1-y) * imageDimensions.height}`)
                                  .join(' ')}
                                className="fill-red-500/30 stroke-red-500 stroke-2"
                              />
                            );
                          }
                        } catch (error) {
                          console.error('Error parsing area coordinates:', error);
                        }
                        return null;
                      })()}
                    </svg>
                  )}
                </Box>
                
                {/* Location Info */}
                {currentLocation && (
                  <Box mt={2}>
                    <Chip 
                      label={currentLocation.name}
                      className="bg-blue-600 text-white"
                      size="small"
                    />
                    {currentLocation.description && (
                      <Typography variant="body2" className="text-gray-400 mt-1">
                        {currentLocation.description}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                <Typography className="text-gray-400">Loading map...</Typography>
              </Box>
            )}
          </Paper>

          {/* Action Buttons */}
          <Paper className="p-4 bg-gray-800 mb-4">
            <Typography variant="h6" className="text-white mb-4">
              Quick Actions
            </Typography>
            <Box display="flex" gap={2}>
              <Button
                variant="outlined"
                sx={{ flex: 1 }}
                startIcon={<TravelIcon />}
                className="text-white border-gray-600 hover:border-blue-400"
                onClick={() => {
                  // Placeholder for travel functionality
                  console.log('Travel clicked');
                }}
              >
                Travel
              </Button>
              <Button
                variant="outlined"
                sx={{ flex: 1 }}
                startIcon={<CatchIcon />}
                className="text-white border-gray-600 hover:border-green-400"
                onClick={() => {
                  // Placeholder for find pokemon functionality
                  console.log('Find Pokemon clicked');
                }}
              >
                Find Pokemon
              </Button>
              <Button
                variant="outlined"
                sx={{ flex: 1 }}
                startIcon={<RestIcon />}
                className="text-white border-gray-600 hover:border-purple-400"
                onClick={() => {
                  // Placeholder for train functionality
                  console.log('Train clicked');
                }}
              >
                Train
              </Button>
            </Box>
          </Paper>

          {/* Trainers Around */}
          <Paper className="p-4 bg-gray-800">
            <Typography variant="h6" className="text-white mb-4">
              Battle Network
            </Typography>
            {!trainersAroundLoading && trainersAround ? (
              <Box display="flex" flexDirection="column" gap={2}>
                {trainersAround.map((trainer) => (
                  <Card 
                    key={trainer.id}
                    className="bg-gray-700 hover:bg-gray-600 transition-colors cursor-pointer"
                    onClick={() => handleTrainerClick(trainer.id)}
                  >
                    <CardActionArea>
                      <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Box display="flex" alignItems="center">
                            <Avatar className="mr-3 bg-blue-600">
                              {trainer.fname.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body1" className="text-white">
                                {trainer.fname} {trainer.lname}
                              </Typography>
                              <Typography variant="body2" className="text-gray-400">
                                {trainer.title}
                              </Typography>
                            </Box>
                          </Box>
                          <Chip 
                            label={trainer.pwtr_rating} 
                            size="small"
                            className="bg-blue-600 text-white"
                          />
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                ))}
              </Box>
            ) : (
              <Typography className="text-gray-400">Loading trainers...</Typography>
            )}
          </Paper>
        </Box>

        {/* Right Column */}
        <Box flex={1}>
          {/* Pokemon Squad Icons */}
          <Paper className="p-4 bg-gray-800 mb-4">
            <Typography variant="h6" className="text-white mb-4">
              Your Pokemon
            </Typography>
            {!pokemonLoading && sortedPokemon.length > 0 ? (
              <>
                <Box 
                  display="grid" 
                  gridTemplateColumns="repeat(auto-fill, minmax(64px, 1fr))" 
                  gap={2}
                >
                  {sortedPokemon.map((p) => (
                    <Tooltip key={p.id} title={`${p.nickname || pokemonEntities[p.species_id]?.name || 'Pokemon'} (Lv. ${p.level})`}>
                      <Box
                        className="cursor-pointer hover:scale-110 transition-transform"
                        onClick={() => handlePokemonClick(p.id)}
                      >
                        <img
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/icons/${p.pokemon_id}.png`}
                          alt={pokemonEntities[p.species_id]?.name || 'Pokemon'}
                          className="w-16 h-16 rounded bg-gray-600 p-1"
                        />
                      </Box>
                    </Tooltip>
                  ))}
                </Box>
                <Box mt={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    className="text-white border-gray-600 hover:border-blue-400"
                    onClick={() => {
                      if (gameState) {
                        navigate(`/squad`);
                      }
                    }}
                  >
                    View Full Squad
                  </Button>
                </Box>
              </>
            ) : pokemonLoading ? (
              <Typography className="text-gray-400">Loading Pokemon...</Typography>
            ) : (
              <Typography className="text-gray-400">No Pokemon found</Typography>
            )}
          </Paper>

          {/* Next Events */}
          <Paper className="p-4 bg-gray-800">
            <Typography variant="h6" className="text-white mb-4">
              Upcoming Events
            </Typography>
            {!nextEventsLoading && nextEvents ? (
              <Box>
                {nextEvents.map((event) => (
                  <Card key={event.id} className="bg-gray-700 mb-2">
                    <CardContent className="py-3">
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="body1" className="text-white">
                            {event.title}
                          </Typography>
                          <Typography variant="body2" className="text-gray-400">
                            {event.date}
                          </Typography>
                        </Box>
                        <Chip 
                          label={event.type} 
                          size="small"
                          className={`${
                            event.type === 'tournament' ? 'bg-green-600' :
                            event.type === 'battle' ? 'bg-red-600' :
                            event.type === 'training' ? 'bg-blue-600' :
                            'bg-gray-600'
                          } text-white`}
                        />
                      </Box>
                      {event.description && (
                        <Typography variant="body2" className="text-gray-400 mt-1">
                          {event.description}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              <Typography className="text-gray-400">Loading events...</Typography>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default Home;
