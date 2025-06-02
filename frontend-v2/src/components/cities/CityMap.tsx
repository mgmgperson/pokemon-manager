import React from 'react';
import { Box, Tooltip, Paper } from '@mui/material';

interface CityMapProps {
    cityName: string;
    regionName: string;
    coordinates: {
        x: number;
        y: number;
    };
}

const CityMap: React.FC<CityMapProps> = ({ cityName, regionName, coordinates }) => {
    const imagePath = `/regions/${regionName.toLowerCase()}.png`;

    return (
        <Paper>
            <Box className="p-4">
                <Box className="relative">
                    <img 
                        src={imagePath} 
                        alt={`${regionName} map with ${cityName} location`} 
                        className="w-full"
                    />
                    <Box
                        className="absolute"
                        style={{
                            top: `${(1-coordinates.y) * 100}%`,
                            left: `${coordinates.x * 100}%`,
                            transform: 'translate(-50%, -50%)',
                        }}
                    >
                        <Tooltip
                            title={
                                <Box className="p-2">
                                    <Box className="font-bold text-lg">{cityName}</Box>
                                </Box>
                            }
                            placement="top"
                            arrow
                            enterTouchDelay={0}
                            leaveTouchDelay={5000}
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
                            <Box
                                className="w-5 h-5 bg-red-500 border-2 border-white rounded-full cursor-pointer hover:scale-125 transition-transform duration-200 animate-pulse"
                            />
                        </Tooltip>
                    </Box>
                </Box>
            </Box>
        </Paper>
    );
};

export default CityMap;
