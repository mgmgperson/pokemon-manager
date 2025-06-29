import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    IconButton,
    Divider,
} from '@mui/material';
import {
    Add as AddIcon,
    Remove as RemoveIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { ShopItem } from '../../types/shop';

interface CartItem extends ShopItem {
    quantity: number;
}

interface CartProps {
    open: boolean;
    onClose: () => void;
    items: CartItem[];
    onUpdateQuantity: (itemId: number, delta: number) => void;
    onRemoveItem: (itemId: number) => void;
    onPurchase: () => void;
    totalCost: number;
    maxBalance: number;
}

const Cart: React.FC<CartProps> = ({
    open,
    onClose,
    items,
    onUpdateQuantity,
    onRemoveItem,
    onPurchase,
    totalCost,
    maxBalance,
}) => {
    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle className="bg-gray-800 text-white">
                Shopping Cart
            </DialogTitle>
            <DialogContent className="bg-gray-800">
                {items.length === 0 ? (
                    <Typography className="text-gray-300 py-4">
                        Your cart is empty
                    </Typography>
                ) : (
                    <Box className="py-4">
                        {items.map((item, index) => (
                            <React.Fragment key={item.id}>
                                {index > 0 && <Divider className="my-2 border-gray-700" />}
                                <Box className="flex justify-between items-center">
                                    <Box className="flex-1">
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
                                            onClick={() => onUpdateQuantity(item.id, -1)}
                                            className="text-white"
                                        >
                                            <RemoveIcon />
                                        </IconButton>
                                        <Typography className="text-white min-w-[2rem] text-center">
                                            {item.quantity}
                                        </Typography>
                                        <IconButton 
                                            size="small"
                                            onClick={() => onUpdateQuantity(item.id, 1)}
                                            className="text-white"
                                        >
                                            <AddIcon />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => onRemoveItem(item.id)}
                                            className="text-red-400 ml-2"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                </Box>
                                {item.stock !== null && (
                                    <Typography variant="caption" className="text-gray-400 mt-1 block">
                                        {item.stock} in stock
                                    </Typography>
                                )}
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
                        {totalCost > maxBalance && (
                            <Typography className="text-red-400 mt-2 text-center">
                                Insufficient funds
                            </Typography>
                        )}
                    </Box>
                )}
            </DialogContent>
            <DialogActions className="bg-gray-800">
                <Button onClick={onClose} className="text-gray-300">
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={onPurchase}
                    disabled={items.length === 0 || totalCost > maxBalance}
                >
                    Purchase
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default Cart;
