import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Box,
    Paper,
    Typography,
    Card,
    CardContent,
    CardActions,
    Button,
    IconButton,
    Divider,
    Alert,
    CircularProgress,
    Badge,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    Add as AddIcon,
    Remove as RemoveIcon,
    ShoppingCart as CartIcon,
    ArrowBack as BackIcon,
} from '@mui/icons-material';
import { Shop, ShopItem } from '../../types/shop';

const fetchShop = async (id: string): Promise<Shop> => {
    const { data } = await axios.get(`http://localhost:5000/shops/${id}`);
    return data.data;
};

const fetchBalance = async (): Promise<{ balance: number }> => {
    const { data } = await axios.get('http://localhost:5000/finances/status');
    return data.data;
};

interface CartItem extends ShopItem {
    quantity: number;
}

const ShopDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [cart, setCart] = React.useState<CartItem[]>([]);
    const [cartOpen, setCartOpen] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const { data: shop, isLoading: isLoadingShop } = useQuery({
        queryKey: ['shop', id],
        queryFn: () => fetchShop(id!),
        enabled: !!id,
    });

    const { data: financeData } = useQuery({
        queryKey: ['finance-status'],
        queryFn: fetchBalance,
    });

    const purchaseMutation = useMutation({
        mutationFn: async (items: { id: number; quantity: number }[]) => {
            const { data } = await axios.post(`http://localhost:5000/shops/${id}/buy`, { items });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance-status'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            setCart([]);
            setCartOpen(false);
        },
        onError: (error: any) => {
            setError(error.response?.data?.error || 'Failed to purchase items');
        },
    });

    const handleAddToCart = (item: ShopItem) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => 
                    i.id === item.id 
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                );
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const handleUpdateQuantity = (itemId: number, delta: number) => {
        setCart(prev => {
            const newCart = prev.map(item => {
                if (item.id === itemId) {
                    const newQuantity = Math.max(0, item.quantity + delta);
                    return newQuantity === 0 ? null : { ...item, quantity: newQuantity };
                }
                return item;
            });
            return newCart.filter((item): item is CartItem => item !== null);
        });
    };

    const handlePurchase = () => {
        const items = cart.map(item => ({
            id: item.id,
            quantity: item.quantity,
        }));
        purchaseMutation.mutate(items);
    };

    const totalCost = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (isLoadingShop) {
        return (
            <Box className="flex justify-center items-center h-full">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box className="p-6 h-[calc(100vh-76px)] flex flex-col">
            <Box className="flex justify-between items-center mb-6">
                <Box className="flex items-center gap-4">
                    <IconButton onClick={() => navigate(-1)} className="text-white">
                        <BackIcon />
                    </IconButton>
                    <Typography variant="h4" className="text-white">
                        {shop?.name}
                    </Typography>
                </Box>
                <Box className="flex items-center gap-4">
                    <Button
                        variant="outlined"
                        onClick={() => navigate(`/edit_shop/${id}`)}
                        className="text-white border-gray-600 hover:border-gray-400"
                        size="small"
                    >
                        Edit Shop
                    </Button>
                    <Typography variant="h6" className="text-white">
                        Balance: <span className="text-green-400">₽{financeData?.balance.toLocaleString() ?? 0}</span>
                    </Typography>
                    <Button
                        variant="outlined"
                        onClick={() => navigate(`/shops/${id}/sell`)}
                        className="text-white border-gray-600 hover:border-gray-400"
                    >
                        Sell Items
                    </Button>
                    <Badge badgeContent={itemCount} color="primary">
                        <IconButton 
                            onClick={() => setCartOpen(true)}
                            className="text-white"
                            disabled={cart.length === 0}
                        >
                            <CartIcon />
                        </IconButton>
                    </Badge>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" onClose={() => setError(null)} className="mb-4">
                    {error}
                </Alert>
            )}

            <Paper className="p-4 mb-4">
                <Typography variant="body1" className="text-gray-300">
                    {shop?.description}
                </Typography>
                {shop?.markup !== 1 && (
                    <Typography variant="subtitle2" className="text-yellow-400 mt-2">
                        {(shop?.markup ?? 1) > 1 ? 'Premium Prices' : 'Discount Prices'}
                    </Typography>
                )}
            </Paper>

            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                    {shop?.items.map((item: ShopItem) => (
                        <Card key={item.id} className="h-full bg-gray-800 flex flex-col">
                            <CardContent className="flex-1">
                                <Typography variant="h6" className="text-white mb-2">
                                    {item.name}
                                </Typography>
                                <Typography variant="body2" className="text-gray-300 mb-2">
                                    {item.description}
                                </Typography>
                                <Typography variant="subtitle1" className="text-green-400">
                                    ₽{item.price.toLocaleString()}
                                </Typography>
                                {item.stock !== null && (
                                    <Typography variant="caption" className="text-gray-400">
                                        Stock: {item.stock}
                                    </Typography>
                                )}
                            </CardContent>
                            <CardActions>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => handleAddToCart(item)}
                                    startIcon={<AddIcon />}
                                    fullWidth
                                >
                                    Add to Cart
                                </Button>
                            </CardActions>
                        </Card>
                    ))}
                </Box>
            </Box>

            <Dialog 
                open={cartOpen} 
                onClose={() => setCartOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle className="bg-gray-800 text-white">
                    Shopping Cart
                </DialogTitle>
                <DialogContent className="bg-gray-800">
                    {cart.length === 0 ? (
                        <Typography className="text-gray-300 py-4">
                            Your cart is empty
                        </Typography>
                    ) : (
                        <Box className="py-4">
                            {cart.map((item, index) => (
                                <React.Fragment key={item.id}>
                                    {index > 0 && <Divider className="my-2 border-gray-700" />}
                                    <Box className="flex justify-between items-center">
                                        <Box>
                                            <Typography className="text-white">
                                                {item.name}
                                            </Typography>
                                            <Typography variant="body2" className="text-gray-400">
                                                ₽{item.price.toLocaleString()} × {item.quantity}
                                            </Typography>
                                        </Box>
                                        <Box className="flex items-center gap-2">
                                            <IconButton 
                                                size="small"
                                                onClick={() => handleUpdateQuantity(item.id, -1)}
                                                className="text-white"
                                            >
                                                <RemoveIcon />
                                            </IconButton>
                                            <Typography className="text-white">
                                                {item.quantity}
                                            </Typography>
                                            <IconButton 
                                                size="small"
                                                onClick={() => handleUpdateQuantity(item.id, 1)}
                                                className="text-white"
                                            >
                                                <AddIcon />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </React.Fragment>
                            ))}
                            <Divider className="my-4 border-gray-700" />
                            <Box className="flex justify-between items-center">
                                <Typography variant="h6" className="text-white">
                                    Total
                                </Typography>
                                <Typography variant="h6" className="text-green-400">
                                    ₽{totalCost.toLocaleString()}
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions className="bg-gray-800">
                    <Button onClick={() => setCartOpen(false)} className="text-gray-300">
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handlePurchase}
                        disabled={cart.length === 0 || totalCost > (financeData?.balance ?? 0)}
                    >
                        Purchase
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ShopDetail;
