import React from 'react';
import { Box, Paper } from '@mui/material';

interface LocationMapProps {
    locationName: string;
    regionName: string;
    areaCoordinates: [number, number][];
}

const LocationMap: React.FC<LocationMapProps> = ({ locationName, regionName, areaCoordinates }) => {
    const imagePath = `/regions/${regionName.toLowerCase()}.png`;
    const [imageDimensions, setImageDimensions] = React.useState<{ width: number; height: number } | null>(null);

    // Handle image load to get dimensions
    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        setImageDimensions({
            width: img.width,
            height: img.height
        });
    };

    return (
        <Paper>
            <Box className="p-4">
                <Box className="relative">
                    <img 
                        src={imagePath} 
                        alt={`${regionName} map showing ${locationName} area`} 
                        className="w-full"
                        onLoad={handleImageLoad}
                    />
                    {imageDimensions && (
                        <svg
                            className="absolute top-0 left-0"
                            width={imageDimensions.width}
                            height={imageDimensions.height}
                            style={{ pointerEvents: 'none' }}
                        >
                            {areaCoordinates.length > 0 && (
                                <polygon
                                    points={areaCoordinates
                                        .map(([y, x]) => `${x * imageDimensions.width},${(1-y) * imageDimensions.height}`)
                                        .join(' ')}
                                    className="fill-red-500/30 stroke-red-500 stroke-2"
                                />
                            )}
                        </svg>
                    )}
                </Box>
            </Box>
        </Paper>
    );
};

export default LocationMap;
