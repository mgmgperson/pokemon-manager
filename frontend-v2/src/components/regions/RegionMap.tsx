import React from 'react';
import { Box, Tooltip } from '@mui/material';
import { City } from '../../types/region';
import { Link } from 'react-router-dom';

interface RegionMapProps {
    regionName: string;
    cities: City[];
}

const RegionMap: React.FC<RegionMapProps> = ({ regionName, cities }) => {
    const imagePath = `/regions/${regionName.toLowerCase()}.png`;

    return (
        <Box className="relative">
            <img 
                src={imagePath} 
                alt={`${regionName} map`} 
                className="w-full"
            />
            {cities.map((city, index) => (
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
        </Box>
    );
};

export default RegionMap; 