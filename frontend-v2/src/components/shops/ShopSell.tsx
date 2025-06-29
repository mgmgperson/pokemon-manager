import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
    Tab,
    Tabs
} from '@mui/material';
import {
    Add as AddIcon,
    Remove as RemoveIcon,
    ShoppingCart as CartIcon,
    ArrowBack as BackIcon,
} from '@mui/icons-material';
import { ItemCategory } from '../../types/items';

interface InventoryItem {
    id: number;
    name: string;
    category: ItemCategory;
    buyPrice: number | null;
    sellPrice: number | null;
    description: string;
    quantity: number;
}

interface GroupedInventory {
    [key: number]: InventoryItem[];
}

interface CartItem extends InventoryItem {
    sellQuantity: number;
}

const fetchInventory = async (): Promise<GroupedInventory> => {
    const { data } = await axios.get('http://localhost:5000/items/inventory');
    return data.data;
};

const fetchBalance = async (): Promise<{ balance: number }> => {
    const { data } = await axios.get('http://localhost:5000/finances/status');
    return data.data;
};

const categoryNames: { [key in ItemCategory]: string } = {
    [ItemCategory.POKEBALL]: 'Poké Balls',
    [ItemCategory.MEDICINE]: 'Medicine',
    [ItemCategory.BATTLE_ITEMS]: 'Battle Items',
    [ItemCategory.BERRIES]: 'Berries',
    [ItemCategory.OTHER]: 'Other Items'
};

const ShopSell: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeCategory, setActiveCategory] = React.useState<ItemCategory>(ItemCategory.POKEBALL);
    const [cart, setCart] = React.useState<CartItem[]>([]);
    const [cartOpen, setCartOpen] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const { data: inventory, isLoading: isLoadingInventory } = useQuery({
        queryKey: ['inventory'],
        queryFn: fetchInventory,
    });

    const { data: financeData } = useQuery({
        queryKey: ['finance-status'],
        queryFn: fetchBalance,
    });

    const sellMutation = useMutation({
        mutationFn: async (items: { id: number; quantity: number }[]) => {
            const { data } = await axios.post('http://localhost:5000/items/sell', { items });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance-status'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            setCart([]);
            setCartOpen(false);
        },
        onError: (error: any) => {
            setError(error.response?.data?.error || 'Failed to sell items');
        },
    });

    const handleAddToCart = (item: InventoryItem) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => 
                    i.id === item.id 
                        ? { ...i, sellQuantity: Math.min(i.sellQuantity + 1, i.quantity) }
                        : i
                );
            }
            return [...prev, { ...item, sellQuantity: 1 }];
        });
    };

    const handleUpdateQuantity = (itemId: number, delta: number) => {
        setCart(prev => {
            const newCart = prev.map(item => {
                if (item.id === itemId) {
                    const newQuantity = Math.max(0, Math.min(item.sellQuantity + delta, item.quantity));
                    return newQuantity === 0 ? null : { ...item, sellQuantity: newQuantity };
                }
                return item;
            });
            return newCart.filter((item): item is CartItem => item !== null);
        });
    };

    const handleSell = () => {
        const items = cart.map(item => ({
            id: item.id,
            quantity: item.sellQuantity,
        }));
        sellMutation.mutate(items);
    };

    const totalValue = cart.reduce((sum, item) => {
        return sum + (item.sellPrice ?? 0) * item.sellQuantity;
    }, 0);
    
    const itemCount = cart.reduce((sum, item) => sum + item.sellQuantity, 0);

    const handleCategoryChange = (_: React.SyntheticEvent, newValue: ItemCategory) => {
        setActiveCategory(newValue);
    };

    if (isLoadingInventory) {
        return (
            <Box className="flex justify-center items-center h-full">
                <CircularProgress />
            </Box>
        );
    }

    const categories = Object.keys(inventory || {}).map(Number) as ItemCategory[];

    return (
        <Box className="p-6 h-[calc(100vh-76px)] flex flex-col">
            <Box className="flex justify-between items-center mb-6">
                <Box className="flex items-center gap-4">
                    <IconButton onClick={() => navigate(-1)} className="text-white">
                        <BackIcon />
                    </IconButton>
                    <Typography variant="h4" className="text-white">
                        Sell Items
                    </Typography>
                </Box>
                <Box className="flex items-center gap-4">
                    <Typography variant="h6" className="text-white">
                        Balance: <span className="text-green-400">₽{financeData?.balance.toLocaleString() ?? 0}</span>
                    </Typography>
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

            <Paper className="mb-6">
                <Tabs
                    value={activeCategory}
                    onChange={handleCategoryChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    className="bg-gray-800"
                >
                    {categories.map((category) => (
                        <Tab
                            key={category}
                            label={categoryNames[category as ItemCategory]}
                            value={category}
                            className="text-white"
                        />
                    ))}
                </Tabs>
            </Paper>

            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                    {inventory?.[activeCategory]?.map((item) => (
                        <Card key={item.id} className="h-full bg-gray-800 flex flex-col">
                            <CardContent className="flex-1">
                                <Typography variant="h6" className="text-white mb-2">
                                    {item.name}
                                </Typography>
                                <Typography variant="body2" className="text-gray-300 mb-2">
                                    {item.description}
                                </Typography>
                                <Typography variant="subtitle1" className="text-green-400">
                                    Sell Price: ₽{item.sellPrice?.toLocaleString() ?? 'N/A'}
                                </Typography>
                                <Typography variant="caption" className="text-gray-400">
                                    Quantity: {item.quantity}
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => handleAddToCart(item)}
                                    startIcon={<AddIcon />}
                                    fullWidth
                                    disabled={!item.sellPrice || item.quantity === 0}
                                >
                                    Add to Sell Cart
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
                    Items to Sell
                </DialogTitle>
                <DialogContent className="bg-gray-800">
                    {cart.length === 0 ? (
                        <Typography className="text-gray-300 py-4">
                            No items selected to sell
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
                                                ₽{item.sellPrice?.toLocaleString()} × {item.sellQuantity}
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
                                                {item.sellQuantity}
                                            </Typography>
                                            <IconButton 
                                                size="small"
                                                onClick={() => handleUpdateQuantity(item.id, 1)}
                                                className="text-white"
                                                disabled={item.sellQuantity >= item.quantity}
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
                                    Total Value
                                </Typography>
                                <Typography variant="h6" className="text-green-400">
                                    ₽{totalValue.toLocaleString()}
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
                        onClick={handleSell}
                        disabled={cart.length === 0}
                    >
                        Sell Items
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ShopSell;
