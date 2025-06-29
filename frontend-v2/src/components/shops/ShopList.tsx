import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Box,
    Card,
    CardContent,
    CardActionArea,
    Typography,
    Skeleton,
} from '@mui/material';
import { Shop } from '../../types/shop';

const fetchShops = async (): Promise<Shop[]> => {
    const { data } = await axios.get('http://localhost:5000/shops/available');
    return data.data;
};

const ShopList: React.FC = () => {
    const navigate = useNavigate();
    const { data: shops, isLoading, error } = useQuery({
        queryKey: ['shops'],
        queryFn: fetchShops,
    });

    if (isLoading) {
        return (
            <Box className="grid grid-cols-1 gap-4">
                {[1, 2, 3].map((n) => (
                    <Skeleton key={n} variant="rectangular" height={140} />
                ))}
            </Box>
        );
    }

    if (error) {
        return (
            <Box className="flex justify-center items-center">
                <Typography color="error">Error loading shops.</Typography>
            </Box>
        );
    }

    return (
        <Box className="grid grid-cols-1 gap-4">
            {shops?.map((shop) => (
                <Card key={shop.id} className="bg-gray-800 hover:bg-gray-700">
                    <CardActionArea 
                        onClick={() => navigate(`/shops/${shop.id}`)}
                        className="p-2"
                    >
                        <CardContent>
                            <Typography variant="h6" className="text-white mb-2">
                                {shop.name}
                            </Typography>
                            <Typography variant="body2" className="text-gray-300">
                                {shop.description}
                            </Typography>
                            {shop.markup !== 1 && (
                                <Typography variant="caption" className="text-yellow-400 mt-2 block">
                                    {shop.markup > 1 ? 'Premium Prices' : 'Discount Prices'}
                                </Typography>
                            )}
                        </CardContent>
                    </CardActionArea>
                </Card>
            ))}
        </Box>
    );
};

export default ShopList;
