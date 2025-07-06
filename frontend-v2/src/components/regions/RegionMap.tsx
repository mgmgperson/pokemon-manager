import React, { useState } from 'react';
import { Box, Tooltip, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { City } from '../../types/region';
import { Location } from '../../types/location';
import { Link } from 'react-router-dom';
import MapIcon from '@mui/icons-material/Map';
import LocationCityIcon from '@mui/icons-material/LocationCity';

interface RegionMapProps {
    regionName: string;
    cities: City[];
    locations?: Location[];
}

type MapMode = 'cities' | 'locations';

const RegionMap: React.FC<RegionMapProps> = ({ regionName, cities, locations = [] }) => {
    const [mode, setMode] = useState<MapMode>('cities');
    const imagePath = `/regions/${regionName.toLowerCase()}.png`;
    const [imageDimensions, setImageDimensions] = React.useState<{ width: number; height: number } | null>(null);

    // Handle image load to get dimensions for accurate location area rendering
    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        setImageDimensions({
            width: img.width,
            height: img.height
        });
    };

    const handleModeChange = (_event: React.MouseEvent<HTMLElement>, newMode: MapMode | null) => {
        if (newMode !== null) {
            setMode(newMode);
        }
    };

    return (
        <Box>
            <Box className="mb-4 flex justify-end">
                <ToggleButtonGroup
                    value={mode}
                    exclusive
                    onChange={handleModeChange}
                    aria-label="map view mode"
                    className="text-white"
                    size="small"
                >
                    <ToggleButton value="cities" aria-label="cities view" className="text-white">
                        <LocationCityIcon className="mr-1" />
                        Cities
                    </ToggleButton>
                    <ToggleButton value="locations" aria-label="locations view" className="text-white">
                        <MapIcon className="mr-1" />
                        Locations
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>
            
            <Box className="relative">
                <img 
                    src={imagePath} 
                    alt={`${regionName} map`} 
                    className="w-full"
                    onLoad={handleImageLoad}
                />

                {mode === 'cities' && cities.map((city, index) => (
                    <Box
                        key={index}
                        className="absolute"
                        style={{
                            top: `${(1-city.y_coordinate) * 100}%`,
                            left: `${city.x_coordinate * 100}%`,
                            transform: 'translate(-50%, -50%)',
                        }}
                    >
                        <Tooltip
                            title={
                                <Box className="p-2">
                                    <Box className="font-bold text-lg">{city.name}</Box>
                                    <Box className="text-sm">
                                        Population: {(city.population ?? 0).toLocaleString()}
                                    </Box>
                                    <Box className="text-xs text-blue-300 mt-1">
                                        Click to view details
                                    </Box>
                                </Box>
                            }
                            placement="top"
                            arrow
                            enterTouchDelay={0}
                            leaveTouchDelay={3000}
                            slotProps={{
                                popper: {
                                    modifiers: [
                                        {
                                            name: 'offset',
                                            options: {
                                                offset: [0, -5],
                                            },
                                        },
                                        {
                                            name: 'preventOverflow',
                                            enabled: true,
                                            options: {
                                                altAxis: true,
                                                tether: false,
                                                rootBoundary: 'document',
                                            },
                                        },
                                    ],
                                }
                            }}
                        >
                            <Link to={`/cities/${city.id}`}>
                                <Box
                                    className="w-4 h-4 bg-red-500 border-2 border-white rounded-full cursor-pointer hover:scale-125 transition-transform duration-200 hover:bg-red-400"
                                />
                            </Link>
                        </Tooltip>
                    </Box>
                ))}

                {mode === 'locations' && imageDimensions && (
                    <svg
                        className="absolute top-0 left-0"
                        width={imageDimensions.width}
                        height={imageDimensions.height}
                        style={{ pointerEvents: 'none' }}
                    >
                        {locations.map((location, index) => {
                            if (!location.area_coordinates) return null;
                            
                            // Parse coordinates and handle potential errors
                            let coords;
                            try {
                                coords = JSON.parse(location.area_coordinates);
                                if (!Array.isArray(coords) || coords.length < 3) {
                                    console.warn(`Invalid coordinates for location ${location.name}:`, location.area_coordinates);
                                    return null;
                                }
                            } catch (e) {
                                console.error(`Failed to parse coordinates for location ${location.name}:`, e);
                                return null;
                            }

                            // Calculate points string
                            const points = coords
                                .map(([y, x]: [number, number]) => 
                                    `${x * imageDimensions.width},${(1-y) * imageDimensions.height}`
                                )
                                .join(' ');

                            return (
                                <Link key={index} to={`/locations/${location.id}`}>
                                    <Tooltip
                                        title={
                                            <Box className="p-2">
                                                <Box className="font-bold text-lg">{location.name}</Box>
                                                <Box className="text-sm">
                                                    Population: {(location.population ?? 0).toLocaleString()}
                                                </Box>
                                                {location.description && (
                                                    <Box className="text-sm mt-1">
                                                        {location.description}
                                                    </Box>
                                                )}
                                                <Box className="text-xs text-blue-300 mt-1">
                                                    Click to view details
                                                </Box>
                                            </Box>
                                        }
                                        placement="top"
                                        arrow
                                        enterTouchDelay={0}
                                        leaveTouchDelay={3000}
                                    >
                                        <polygon
                                            points={points}
                                            className="fill-blue-500/30 stroke-blue-500 stroke-2 cursor-pointer hover:fill-blue-500/40 transition-colors duration-200"
                                            style={{ pointerEvents: 'all' }}
                                        />
                                    </Tooltip>
                                </Link>
                            );
                        })}
                    </svg>
                )}
            </Box>
        </Box>
    );
};

export default RegionMap;