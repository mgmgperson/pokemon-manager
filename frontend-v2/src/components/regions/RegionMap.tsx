import React from 'react';
import { Box, Tooltip } from '@mui/material';
import { City } from '../../types/region';

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
                <Tooltip
                    key={index}
                    title={
                        <Box className="p-2">
                            <Box className="font-bold text-lg">{city.name}</Box>
                            <Box className="text-sm">
                                Population: {(city.population ?? 0).toLocaleString()}
                            </Box>
                        </Box>
                    }
                    placement="top"
                    arrow
                >
                    <Box
                        className="absolute w-4 h-4 bg-red-500 rounded-full cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-125 transition-transform duration-200"
                        style={{
                            top: `${(1-city.y_coordinate) * 100}%`,
                            left: `${city.x_coordinate * 100}%`,
                        }}
                    />
                </Tooltip>
            ))}
        </Box>
    );
};

export default RegionMap; 