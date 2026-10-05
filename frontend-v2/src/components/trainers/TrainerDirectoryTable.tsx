import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
} from '@mui/material';
import type {
  Trainer,
  TrainerDirectoryEntry,
  TrainerDirectoryPagination,
} from '../../types/trainer';

export type TrainerDirectorySortField =
  | 'rank'
  | 'name'
  | 'pwtr_rating'
  | 'region_name'
  | 'title'
  | 'birthdate'
  | 'age'
  | 'peak_rating'
  | 'peak_rank'
  | 'active_status';

type Order = 'asc' | 'desc';

interface HeadCell {
  id: TrainerDirectorySortField;
  label: string;
  numeric: boolean;
}

interface TrainerDirectoryTableProps {
  trainers: TrainerDirectoryEntry[];
  pagination: TrainerDirectoryPagination | undefined;
  page: number;
  rowsPerPage: number;
  order: Order;
  orderBy: TrainerDirectorySortField;
  onRequestSort: (property: TrainerDirectorySortField) => void;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  showPeakColumns?: boolean;
}

const coreHeadCells: HeadCell[] = [
  { id: 'rank', numeric: true, label: 'Rank' },
  { id: 'name', numeric: false, label: 'Name' },
  { id: 'pwtr_rating', numeric: true, label: 'Rating' },
  { id: 'region_name', numeric: false, label: 'Region' },
  { id: 'title', numeric: false, label: 'Title' },
  { id: 'birthdate', numeric: false, label: 'Birthdate' },
  { id: 'age', numeric: true, label: 'Age' },
];

const peakHeadCells: HeadCell[] = [
  { id: 'peak_rating', numeric: true, label: 'Peak Rating' },
  { id: 'peak_rank', numeric: true, label: 'Peak Rank' },
];

const statusHeadCell: HeadCell = { id: 'active_status', numeric: false, label: 'Status' };

function formatRating(value: number | null): string {
  return value === null ? 'Unrated' : value.toFixed(2);
}

function formatStatus(status: Trainer['active_status']): string {
  if (status === true || status === 1) {
    return 'Active';
  }
  if (status === false || status === 0) {
    return 'Inactive';
  }
  return 'Unknown';
}

const TrainerDirectoryTable: React.FC<TrainerDirectoryTableProps> = ({
  trainers,
  pagination,
  page,
  rowsPerPage,
  order,
  orderBy,
  onRequestSort,
  onPageChange,
  onRowsPerPageChange,
  showPeakColumns = true,
}) => {
  const [pageInput, setPageInput] = React.useState('');
  const headCells = showPeakColumns
    ? [...coreHeadCells, ...peakHeadCells, statusHeadCell]
    : [...coreHeadCells, statusHeadCell];

  const handlePageJump = (): void => {
    if (!pagination) {
      return;
    }

    const pageNumber = Number(pageInput);
    if (Number.isInteger(pageNumber) && pageNumber >= 1 && pageNumber <= pagination.totalPages) {
      onPageChange(pageNumber - 1);
      setPageInput('');
    }
  };

  return (
    <>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {headCells.map((headCell) => (
                <TableCell key={headCell.id} align={headCell.numeric ? 'right' : 'left'} className="!text-white">
                  <TableSortLabel
                    active={orderBy === headCell.id}
                    direction={orderBy === headCell.id ? order : 'asc'}
                    onClick={() => onRequestSort(headCell.id)}
                    className="!text-white"
                  >
                    {headCell.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {trainers.map((trainer) => (
              <TableRow key={trainer.id} hover className="hover:!bg-gray-700">
                <TableCell align="right" className="!text-white">{trainer.rank ?? '—'}</TableCell>
                <TableCell className="!text-white">
                  <Link
                    to={`/trainers/${trainer.id}`}
                    className="!text-blue-400 hover:!text-blue-300 !no-underline"
                  >
                    {[trainer.fname, trainer.lname].filter(Boolean).join(' ') || 'Unnamed Trainer'}
                  </Link>
                </TableCell>
                <TableCell align="right" className="!text-white">{formatRating(trainer.pwtr_rating)}</TableCell>
                <TableCell className="!text-white">{trainer.region_name ?? 'Unknown'}</TableCell>
                <TableCell className="!text-white">{trainer.title || 'None'}</TableCell>
                <TableCell className="!text-white">{trainer.birthdate ?? 'Unknown'}</TableCell>
                <TableCell align="right" className="!text-white">{trainer.age ?? 'Unknown'}</TableCell>
                {showPeakColumns && (
                  <>
                    <TableCell align="right" className="!text-white">
                      {trainer.peak_rating === null ? 'N/A' : trainer.peak_rating.toFixed(2)}
                    </TableCell>
                    <TableCell align="right" className="!text-white">{trainer.peak_rank ?? 'N/A'}</TableCell>
                  </>
                )}
                <TableCell className="!text-white">{formatStatus(trainer.active_status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box className="!flex !items-center !justify-between !border-t !border-gray-700">
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={pagination?.totalItems ?? 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_event, newPage) => onPageChange(newPage)}
          onRowsPerPageChange={(event) => onRowsPerPageChange(Number(event.target.value))}
          className="!text-white"
        />
        <Box className="!flex !items-center !gap-2 !pr-4">
          <TextField
            size="small"
            placeholder="Page"
            value={pageInput}
            onChange={(event) => setPageInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handlePageJump();
              }
            }}
            type="number"
            inputProps={{ min: 1, max: pagination?.totalPages ?? 1 }}
            sx={{
              width: '80px',
              '& .MuiInputBase-input': { color: 'white' },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: 'gray' },
                '&:hover fieldset': { borderColor: 'lightgray' },
              },
            }}
          />
          <Button
            variant="contained"
            onClick={handlePageJump}
            size="small"
            disabled={!pagination || pagination.totalPages === 0}
            className="!bg-blue-600 hover:!bg-blue-700"
          >
            Go
          </Button>
        </Box>
      </Box>
    </>
  );
};

export default TrainerDirectoryTable;
