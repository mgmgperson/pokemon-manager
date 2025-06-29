import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    TablePagination,
    TableSortLabel,
    Chip,
    Skeleton,
} from '@mui/material';
import ShopList from '../shops/ShopList';
import { TransactionResponse, Transaction, TransactionCategory, FinanceStatus } from '../../types/finance';

type Order = 'asc' | 'desc';
interface HeadCell {
    id: keyof Transaction;
    label: string;
    numeric: boolean;
}

const headCells: HeadCell[] = [
    { id: 'date', label: 'Date', numeric: false },
    { id: 'category', label: 'Category', numeric: false },
    { id: 'description', label: 'Description', numeric: false },
    { id: 'amount', label: 'Amount', numeric: true },
];

const fetchTransactions = async (
    limit: number,
    offset: number,
    category?: TransactionCategory
): Promise<TransactionResponse> => {
    const { data } = await axios.get(`http://localhost:5000/finances/transactions`, {
        params: { limit, offset, category }
    });
    return data.data;
};

const fetchCategories = async (): Promise<TransactionCategory[]> => {
    const { data } = await axios.get('http://localhost:5000/finances/categories');
    return data.data;
};

const fetchFinanceStatus = async (): Promise<FinanceStatus> => {
    const { data } = await axios.get('http://localhost:5000/finances/status');
    return data.data;
};

const CategoryChip: React.FC<{ category: TransactionCategory }> = ({ category }) => {
    const getColor = () => {
        switch (category) {
            case 'prize': return 'success';
            case 'wages': return 'primary';
            case 'sponsor': return 'secondary';
            case 'training': return 'warning';
            case 'travel': return 'info';
            case 'item_purchase': return 'error';
            case 'sale': return 'success';
            case 'taxes': return 'error';
            default: return 'default';
        }
    };

    return (
        <Chip 
            label={category.replace('_', ' ')} 
            color={getColor()} 
            size="small"
            className="capitalize"
        />
    );
};

const FinanceList: React.FC = () => {
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const [selectedCategory, setSelectedCategory] = React.useState<TransactionCategory | undefined>();
    const [order, setOrder] = React.useState<Order>('desc');
    const [orderBy, setOrderBy] = React.useState<keyof Transaction>('date');

    const { data: transactionData, isLoading: isLoadingTransactions } = useQuery({
        queryKey: ['transactions', page, rowsPerPage, selectedCategory],
        queryFn: () => fetchTransactions(rowsPerPage, page * rowsPerPage, selectedCategory),
    });

    const { data: categories } = useQuery({
        queryKey: ['transaction-categories'],
        queryFn: fetchCategories,
    });

    const { data: financeStatus } = useQuery({
        queryKey: ['finance-status'],
        queryFn: fetchFinanceStatus,
    });

    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleRequestSort = (property: keyof Transaction) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const sortedTransactions = React.useMemo(() => {
        if (!transactionData?.transactions) return [];
        return [...transactionData.transactions].sort((a, b) => {
            if (orderBy === 'date') {
                return order === 'asc' 
                    ? new Date(a.date).getTime() - new Date(b.date).getTime()
                    : new Date(b.date).getTime() - new Date(a.date).getTime();
            }
            if (orderBy === 'amount') {
                return order === 'asc' ? a.amount - b.amount : b.amount - a.amount;
            }
            const aValue = a[orderBy]?.toString() || '';
            const bValue = b[orderBy]?.toString() || '';
            return order === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        });
    }, [transactionData?.transactions, order, orderBy]);

    return (
        <Box className="p-6 h-[calc(100vh-76px)] flex flex-col">
            <Box className="flex justify-between items-center mb-6">
                <Typography variant="h4" className="text-white">
                    Finances & Shops
                </Typography>
                <Box>
                    <Typography variant="h6" className="text-white">
                        Balance: <span className="text-green-400">₽{financeStatus?.balance.toLocaleString() ?? 0}</span>
                    </Typography>
                    {(financeStatus?.debt ?? 0) > 0 && (
                        <Typography variant="subtitle1" className="text-red-400">
                            Debt: ₽{(financeStatus?.debt ?? 0).toLocaleString()}
                        </Typography>
                    )}
                </Box>
            </Box>

            <Box className="flex gap-6 flex-1 min-h-0">
                {/* Left side: Finances */}
                <Paper className="flex-1 p-4 overflow-hidden flex flex-col">
                    <Box className="flex gap-2 mb-4 flex-wrap">
                        <Chip 
                            label="All"
                            color={selectedCategory === undefined ? 'primary' : 'default'}
                            onClick={() => setSelectedCategory(undefined)}
                            className="capitalize"
                        />
                        {categories?.map(category => (
                            <Chip
                                key={category}
                                label={category.replace('_', ' ')}
                                color={selectedCategory === category ? 'primary' : 'default'}
                                onClick={() => setSelectedCategory(category)}
                                className="capitalize"
                            />
                        ))}
                    </Box>

                    <TableContainer className="flex-1">
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    {headCells.map((headCell) => (
                                        <TableCell
                                            key={headCell.id}
                                            align={headCell.numeric ? 'right' : 'left'}
                                            className="!text-white !bg-gray-800"
                                        >
                                            <TableSortLabel
                                                active={orderBy === headCell.id}
                                                direction={orderBy === headCell.id ? order : 'asc'}
                                                onClick={() => handleRequestSort(headCell.id)}
                                                className="!text-white"
                                            >
                                                {headCell.label}
                                            </TableSortLabel>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {isLoadingTransactions ? (
                                    Array.from({ length: rowsPerPage }).map((_, index) => (
                                        <TableRow key={index}>
                                            <TableCell colSpan={4}>
                                                <Skeleton />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    sortedTransactions.map((transaction) => (
                                        <TableRow
                                            key={transaction.id}
                                            className="hover:bg-gray-700"
                                        >
                                            <TableCell className="text-white">
                                                {new Date(transaction.date).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <CategoryChip category={transaction.category} />
                                            </TableCell>
                                            <TableCell className="text-white">
                                                {transaction.description}
                                            </TableCell>
                                            <TableCell 
                                                className={`${transaction.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}
                                                align="right"
                                            >
                                                ₽{transaction.amount.toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TablePagination
                        className="text-white"
                        component="div"
                        count={transactionData?.total ?? 0}
                        page={page}
                        onPageChange={handleChangePage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </Paper>

                {/* Right side: Shops */}
                <Paper className="w-96 p-4 overflow-hidden flex flex-col">
                    <Typography variant="h6" className="text-white mb-4">
                        Available Shops
                    </Typography>
                    <Box className="flex-1 overflow-auto">
                        <ShopList />
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
};

export default FinanceList;
