import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    SelectChangeEvent,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { 
    EditableShop, 
    BasicRegion, 
    BasicTerrain, 
    BasicLocation, 
    BasicItem, 
    ShopItemFormData 
} from '../../../types/shop';

const fetchShop = async (id: string): Promise<EditableShop> => {
    const { data } = await axios.get(`http://localhost:5000/shops/${id}/edit`);
    return data.data;
};

const fetchRegions = async (): Promise<BasicRegion[]> => {
    const { data } = await axios.get('http://localhost:5000/regions');
    return data.data;
};

const fetchTerrains = async (): Promise<BasicTerrain[]> => {
    const { data } = await axios.get('http://localhost:5000/terrains');
    return data.data;
};

const fetchLocations = async (): Promise<BasicLocation[]> => {
    const { data } = await axios.get('http://localhost:5000/locations');
    return data.data;
};

const fetchItems = async (): Promise<BasicItem[]> => {
    const { data } = await axios.get('http://localhost:5000/items/all');
    return data.data;
};

const updateShop = async ({ id, updatedShop }: { id: string, updatedShop: any }) => {
    const { data } = await axios.put(`http://localhost:5000/shops/${id}`, updatedShop);
    return data;
};

const EditShop: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [formData, setFormData] = useState<Partial<EditableShop>>({
        name: '',
        scope: 'special',
        region_id: null,
        terrain_id: null,
        location_id: null,
        description: '',
        markup: 1.0,
    });

    const [showItemDialog, setShowItemDialog] = useState(false);
    const [currentItem, setCurrentItem] = useState<ShopItemFormData>({
        item_id: 0,
        price: 0,
        stock: null,
    });
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
    const [shopItems, setShopItems] = useState<ShopItemFormData[]>([]);

    // Queries
    const { data: shopData, isLoading: isShopLoading } = useQuery({
        queryKey: ['shop', id],
        queryFn: () => fetchShop(id!),
        enabled: !!id,
    });

    const { data: regionsData, isLoading: isRegionsLoading } = useQuery({
        queryKey: ['regions'],
        queryFn: fetchRegions,
    });

    const { data: terrainsData, isLoading: isTerrainsLoading } = useQuery({
        queryKey: ['terrains'],
        queryFn: fetchTerrains,
    });

    const { data: locationsData, isLoading: isLocationsLoading } = useQuery({
        queryKey: ['locations'],
        queryFn: fetchLocations,
    });

    const { data: itemsData, isLoading: isItemsLoading } = useQuery({
        queryKey: ['items'],
        queryFn: fetchItems,
    });

    // Mutation for updating shop
    const mutation = useMutation({
        mutationFn: updateShop,
        onSuccess: () => {
            navigate(`/shops/${id}`, { replace: true });
        },
    });

    // Load shop data into form
    useEffect(() => {
        if (shopData) {
            setFormData({
                name: shopData.name,
                scope: shopData.scope,
                region_id: shopData.region_id,
                terrain_id: shopData.terrain_id,
                location_id: shopData.location_id,
                description: shopData.description,
                markup: shopData.markup,
            });
            
            // Convert shop items to form data
            const formItems = shopData.items?.map(item => ({
                item_id: item.id,
                price: item.price,
                stock: item.stock,
            })) || [];
            setShopItems(formItems);
        }
    }, [shopData]);

    // Form handlers
    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSelectChange = (e: SelectChangeEvent<any>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear dependent fields when scope changes
        if (name === 'scope') {
            setFormData(prev => ({
                ...prev,
                region_id: null,
                terrain_id: null,
                location_id: null,
            }));
        }
    };

    // Item dialog handlers
    const handleItemSelectChange = (e: SelectChangeEvent<number>) => {
        const { name, value } = e.target;
        setCurrentItem(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleItemTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCurrentItem(prev => ({
            ...prev,
            [name]: name === 'stock' && value === '' ? null : value
        }));
    };

    const handleItemSubmit = () => {
        if (editingItemIndex !== null) {
            const updatedItems = [...shopItems];
            updatedItems[editingItemIndex] = currentItem;
            setShopItems(updatedItems);
        } else {
            setShopItems(prev => [...prev, currentItem]);
        }
        
        setShowItemDialog(false);
        setEditingItemIndex(null);
        setCurrentItem({ item_id: 0, price: 0, stock: null });
    };

    const handleEditItem = (index: number) => {
        setCurrentItem(shopItems[index]);
        setEditingItemIndex(index);
        setShowItemDialog(true);
    };

    const handleDeleteItem = (index: number) => {
        const updatedItems = [...shopItems];
        updatedItems.splice(index, 1);
        setShopItems(updatedItems);
    };

    // Form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (id) {
            mutation.mutate({
                id,
                updatedShop: {
                    ...formData,
                    items: shopItems
                }
            });
        }
    };

    // Filter locations by selected region for regional shops
    const filteredLocations = formData.scope === 'regional' && formData.region_id
        ? locationsData?.filter(location => location.region_id === formData.region_id)
        : locationsData;

    if (isShopLoading || isRegionsLoading || isTerrainsLoading || isLocationsLoading || isItemsLoading) {
        return <Typography>Loading...</Typography>;
    }

    return (
        <Box component="form" onSubmit={handleSubmit} className="p-6">
            <Paper className="p-6">
                <Typography variant="h4" className="mb-6 text-white">
                    {id ? 'Edit' : 'New'} Shop
                </Typography>

                <Box className="grid grid-cols-2 !gap-6">
                    {/* Basic Information */}
                    <Box className="flex flex-col gap-6">
                        <TextField
                            fullWidth
                            label="Name"
                            name="name"
                            value={formData.name || ''}
                            onChange={handleTextChange}
                            required
                        />

                        <FormControl fullWidth>
                            <InputLabel>Scope</InputLabel>
                            <Select
                                name="scope"
                                value={formData.scope || ''}
                                onChange={handleSelectChange}
                                required
                            >
                                <MenuItem value="special">Special (Location-specific)</MenuItem>
                                <MenuItem value="regional">Regional (Region + Terrain)</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="Description"
                            name="description"
                            multiline
                            rows={3}
                            value={formData.description || ''}
                            onChange={handleTextChange}
                        />

                        <TextField
                            fullWidth
                            label="Markup Multiplier"
                            name="markup"
                            type="number"
                            inputProps={{ step: 0.1 }}
                            value={formData.markup || 1.0}
                            onChange={handleTextChange}
                            helperText="Price multiplier for base item prices"
                        />
                    </Box>

                    {/* Scope-specific Configuration */}
                    <Box className="flex flex-col gap-6">
                        {formData.scope === 'regional' ? (
                            <>
                                <FormControl fullWidth>
                                    <InputLabel>Region</InputLabel>
                                    <Select
                                        name="region_id"
                                        value={formData.region_id || ''}
                                        onChange={handleSelectChange}
                                        required
                                    >
                                        {regionsData?.map(region => (
                                            <MenuItem key={region.id} value={region.id}>
                                                {region.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl fullWidth>
                                    <InputLabel>Terrain</InputLabel>
                                    <Select
                                        name="terrain_id"
                                        value={formData.terrain_id || ''}
                                        onChange={handleSelectChange}
                                        required
                                    >
                                        {terrainsData?.map(terrain => (
                                            <MenuItem key={terrain.id} value={terrain.id}>
                                                {terrain.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </>
                        ) : (
                            <FormControl fullWidth>
                                <InputLabel>Location</InputLabel>
                                <Select
                                    name="location_id"
                                    value={formData.location_id || ''}
                                    onChange={handleSelectChange}
                                    required
                                >
                                    {filteredLocations?.map(location => (
                                        <MenuItem key={location.id} value={location.id}>
                                            {location.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                        <Box className="text-center text-gray-400">
                            <Typography variant="body2">
                                {formData.scope === 'regional' 
                                    ? 'Regional shops appear in all locations within the selected region that have the selected terrain type.'
                                    : 'Special shops only appear at the specific selected location.'
                                }
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Shop Items Section */}
                <Box className="mt-6">
                    <Box className="flex justify-between items-center mb-4">
                        <Typography variant="h6">Shop Items</Typography>
                        <Button
                            startIcon={<AddIcon />}
                            onClick={() => setShowItemDialog(true)}
                        >
                            Add Item
                        </Button>
                    </Box>

                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Item</TableCell>
                                    <TableCell>Price</TableCell>
                                    <TableCell>Stock</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {shopItems?.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            {itemsData?.find(i => i.id === item.item_id)?.name}
                                        </TableCell>
                                        <TableCell>{item.price}</TableCell>
                                        <TableCell>{item.stock || 'Infinite'}</TableCell>
                                        <TableCell>
                                            <IconButton onClick={() => handleEditItem(index)}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton onClick={() => handleDeleteItem(index)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>

                <Box className="mt-6 flex justify-end gap-4">
                    <Button
                        variant="outlined"
                        onClick={() => navigate(-1)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        type="submit"
                        disabled={mutation.isPending}
                    >
                        Save Changes
                    </Button>
                </Box>
            </Paper>

            {/* Item Dialog */}
            <Dialog
                open={showItemDialog}
                onClose={() => setShowItemDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {editingItemIndex !== null ? 'Edit' : 'Add'} Shop Item
                </DialogTitle>
                <DialogContent>
                    <Box className="space-y-4 pt-4">
                        <FormControl fullWidth>
                            <InputLabel>Item</InputLabel>
                            <Select
                                name="item_id"
                                value={currentItem.item_id}
                                onChange={handleItemSelectChange}
                                required
                            >
                                {itemsData?.map(item => (
                                    <MenuItem key={item.id} value={item.id}>
                                        {item.name} (Base: {item.buyPrice})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="Price"
                            name="price"
                            type="number"
                            value={currentItem.price}
                            onChange={handleItemTextChange}
                            required
                            helperText="Selling price in the shop"
                        />

                        <TextField
                            fullWidth
                            label="Stock"
                            name="stock"
                            type="number"
                            value={currentItem.stock || ''}
                            onChange={handleItemTextChange}
                            helperText="Leave empty for infinite stock"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowItemDialog(false)}>Cancel</Button>
                    <Button onClick={handleItemSubmit} variant="contained">
                        {editingItemIndex !== null ? 'Update' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EditShop;
