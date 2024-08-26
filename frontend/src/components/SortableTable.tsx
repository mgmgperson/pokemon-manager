import React, { useState, useMemo } from 'react';
import { Table, Pagination } from 'react-bootstrap';

interface SortableTableProps<T> {
    columns: Array<{ key: keyof T | 'custom', label: string, render?: (item: T, index?: number) => React.ReactNode }>;
    data: T[];
    currentPage?: number;
    itemsPerPage?: number;
    withPagination?: boolean; // Optional prop to control pagination
}

const SortableTable = <T extends {}>({
    columns,
    data,
    currentPage = 1,
    itemsPerPage = 20,
    withPagination = false
}: SortableTableProps<T>) => {
    const [sortConfig, setSortConfig] = useState<{ key: keyof T, direction: string } | null>(null);
    const [page, setPage] = useState<number>(currentPage);

    const sortedData = useMemo(() => {
        let sortableData = [...data];
        if (sortConfig !== null) {
            sortableData.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableData;
    }, [data, sortConfig]);

    const paginatedData = useMemo(() => {
        if (!withPagination) return sortedData;

        const indexOfLastItem = page * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        return sortedData.slice(indexOfFirstItem, indexOfLastItem);
    }, [sortedData, page, itemsPerPage, withPagination]);

    const requestSort = (key: keyof T) => {
        let direction = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getClassNamesFor = (key: keyof T) => {
        if (!sortConfig) {
            return;
        }
        return sortConfig.key === key ? sortConfig.direction : undefined;
    };

    const totalPages = Math.ceil(sortedData.length / itemsPerPage);

    return (
        <div>
            <Table hover>
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column.key as string}
                                onClick={column.key !== 'custom' ? () => requestSort(column.key as keyof T) : undefined}
                                className={getClassNamesFor(column.key as keyof T)}
                                style={{ cursor: column.key !== 'custom' ? 'pointer' : 'default' }}
                            >
                                {column.label} {sortConfig?.key === column.key ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {paginatedData.map((item, index) => (
                        <tr key={index}>
                            {columns.map((column) => (
                                <td key={column.key as string}>
                                    {column.render ? column.render(item, index + (page - 1) * itemsPerPage) : item[column.key as keyof T] as React.ReactNode}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </Table>

            {withPagination && (
                <Pagination>
                    <Pagination.First onClick={() => setPage(1)} disabled={page === 1} />
                    <Pagination.Prev onClick={() => setPage(page - 1)} disabled={page === 1} />
                    {[...Array(totalPages)].map((_, i) => (
                        <Pagination.Item key={i + 1} active={i + 1 === page} onClick={() => setPage(i + 1)}>
                            {i + 1}
                        </Pagination.Item>
                    ))}
                    <Pagination.Next onClick={() => setPage(page + 1)} disabled={page === totalPages} />
                    <Pagination.Last onClick={() => setPage(totalPages)} disabled={page === totalPages} />
                </Pagination>
            )}
        </div>
    );
};

export default SortableTable;
