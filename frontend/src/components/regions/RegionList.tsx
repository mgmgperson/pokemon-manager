import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import SortableTable from '../SortableTable';
import { Link } from 'react-router-dom';
import { Region } from '../../types';  // Assuming Region is defined in your types.ts file

// Fetch regions data
const fetchRegions = async (): Promise<Region[]> => {
    const { data } = await axios.get('http://localhost:5000/regions');
    return data.data;
};

const RegionList: React.FC = () => {
    // Use React Query to fetch regions
    const { data: regions, isLoading, error } = useQuery({
        queryKey: ['regions'],
        queryFn: fetchRegions,
    });

    const columns: Array<{ key: keyof Region, label: string, render?: (item: Region) => React.ReactNode }> = [
        { 
            key: 'name', 
            label: 'Name', 
            render: (item: Region) => (
                <Link 
                    to={`/regions/${item.id}`} 
                    className="text-decoration-none text-dark link-primary link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover"
                >
                    {item.name}
                </Link>
            )
        },
        { key: 'population', label: 'Population' },
    ];

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error fetching regions data.</div>;
    }

    return (
        <div>
            <h1>Regions</h1>
            {regions && <SortableTable columns={columns} data={regions} />}
        </div>
    );
};

export default RegionList;
