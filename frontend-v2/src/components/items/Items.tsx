import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Box,
    Paper,
    Typography,
    CircularProgress,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemText,
    Chip,
    Divider,
    Button,
    IconButton,
    Stack
} from '@mui/material';
import { Store as ShopIcon } from '@mui/icons-material';
import { InventoryItem, GroupedInventory, categoryNames } from '../../types/item';
import { ItemCategory } from '../../../../server/src/reference-data/item';

const fetchInventory = async (): Promise<GroupedInventory> => {
    const { data } = await axios.get('http://localhost:5000/items/inventory');
    return data.data;
};

const fetchBalance = async (): Promise<{ balance: number; debt: number }> => {
    const { data } = await axios.get('http://localhost:5000/finances/status');
    return data.data;
};

const Items: React.FC = () => {
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = React.useState<ItemCategory>(ItemCategory.POKEBALL);
    const [selectedItem, setSelectedItem] = React.useState<InventoryItem | null>(null);
    
    const { data: inventory, isLoading, error } = useQuery({
        queryKey: ['inventory'],
        queryFn: fetchInventory,
    });

    const { data: financeStatus } = useQuery({
        queryKey: ['finance-status'],
        queryFn: fetchBalance,
    });

    const handleCategoryChange = (_: React.SyntheticEvent, newValue: ItemCategory) => {
        setActiveCategory(newValue);
        setSelectedItem(null);
    };

    const handleItemClick = (item: InventoryItem) => {
        setSelectedItem(item);
    };

    if (isLoading) {
        return (
            <Box className="flex justify-center items-center h-full p-4">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box className="flex justify-center items-center h-full p-4">
                <Typography color="error">Error loading inventory.</Typography>
            </Box>
        );
    }

    const categories = Object.keys(inventory || {}).map(Number) as ItemCategory[];

    return (
        <Box className="p-6 h-[calc(100vh-76px)] flex flex-col">
            <Box className="flex justify-between items-center mb-6">
                <Typography variant="h4" className="text-white">
                    Item Bag
                </Typography>
                
                <Stack direction="row" spacing={2} alignItems="center">
                    <Button
                        variant="outlined"
                        onClick={() => navigate('/finances')}
                        className="text-white border-gray-600 hover:border-gray-400"
                    >
                        ₽{financeStatus?.balance?.toLocaleString() ?? 0}
                    </Button>
                    <IconButton 
                        onClick={() => navigate('/finances')}
                        className="text-white hover:text-blue-400"
                    >
                        <ShopIcon />
                    </IconButton>
                </Stack>
            </Box>

            <Paper className="mb-6">
                <Tabs
                    value={activeCategory}
                    onChange={handleCategoryChange}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    {categories.map((category) => (
                        <Tab
                            key={category}
                            label={categoryNames[category]}
                            value={category}
                            className="text-white"
                        />
                    ))}
                </Tabs>
            </Paper>

            <div className="flex flex-1 gap-6 min-h-0">
                {/* Items List */}
                <Paper className="flex-1 overflow-auto">
                    <List className="p-0">
                        {inventory?.[activeCategory]?.map((item, index) => (
                            <React.Fragment key={item.id}>
                                {index > 0 && <Divider className="!border-gray-700" />}
                                <ListItem
                                    sx={{
                                        cursor: 'pointer',
                                        '&:hover': { backgroundColor: 'rgba(55, 65, 81, 0.7)' },
                                        ...(selectedItem?.id === item.id && {
                                            backgroundColor: 'rgba(55, 65, 81, 0.5)'
                                        })
                                    }}
                                    onClick={() => handleItemClick(item)}
                                >
                                    <ListItemText
                                        primary={
                                            <Typography className="text-white">
                                                {item.name}
                                            </Typography>
                                        }
                                    />
                                    <Chip
                                        label={`×${item.quantity}`}
                                        size="small"
                                        className="bg-blue-500 text-white ml-2"
                                    />
                                </ListItem>
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>

                {/* Item Details */}
                <Paper className="w-96 p-4">
                    {selectedItem ? (
                        <>
                            <Box className="flex justify-between items-start mb-4">
                                <Typography variant="h6" className="text-white">
                                    {selectedItem.name}
                                </Typography>
                                <Chip
                                    label={`×${selectedItem.quantity}`}
                                    size="small"
                                    className="bg-blue-500 text-white"
                                />
                            </Box>
                            
                            {/* Placeholder for item image */}
                            <Box className="w-32 h-32 mx-auto mb-4 bg-gray-700 rounded flex items-center justify-center">
                                <Typography className="text-gray-500">
                                    Item Image
                                </Typography>
                            </Box>

                            <Typography className="text-gray-300 mb-4">
                                {selectedItem.description}
                            </Typography>

                            <div className="space-y-2">
                                {selectedItem.buyPrice && (
                                    <Typography className="text-gray-400">
                                        Buy Price: ₽{selectedItem.buyPrice}
                                    </Typography>
                                )}
                                {selectedItem.sellPrice && (
                                    <Typography className="text-gray-400">
                                        Sell Price: ₽{selectedItem.sellPrice}
                                    </Typography>
                                )}
                            </div>
                        </>
                    ) : (
                        <Box className="h-full flex items-center justify-center">
                            <Typography className="text-gray-500">
                                Select an item to view details
                            </Typography>
                        </Box>
                    )}
                </Paper>
            </div>
        </Box>
    );
};

export default Items;
