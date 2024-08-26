import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import SortableTable from '../SortableTable';

interface Trainer {
    id: number;
    fname: string;
    lname: string;
    pwtr_rating: number;
    region_name: string;
    title: string;
    rank: number;
    name: string;
}

const TrainerList: React.FC = () => {
    const [trainers, setTrainers] = useState<Trainer[]>([]);

    useEffect(() => {
        const fetchTrainers = async () => {
            try {
                const response = await axios.get('http://localhost:5000/trainers');
                const validTrainers = response.data.data.filter((trainer: Trainer) => trainer.pwtr_rating !== null);
                const trainersWithName = validTrainers.map((trainer: Trainer, index: number) => ({
                    ...trainer,
                    name: `${trainer.fname} ${trainer.lname}`,
                    rank: index + 1, 
                }));
                setTrainers(trainersWithName);
            } catch (error) {
                console.error('Error fetching trainers:', error);
            }
        };

        fetchTrainers();
    }, []);

    const columns: Array<{ key: keyof Trainer, label: string, render?: (item: Trainer) => React.ReactNode }> = [
        { key: 'rank', label: 'Rank' },
        { 
            key: 'name', 
            label: 'Name',
            render: (item: Trainer) => (
                <Link to={`/trainers/${item.id}`} style={{ textDecoration: 'none' }}>
                    {item.name}
                </Link>
            )
        },
        { 
            key: 'pwtr_rating', 
            label: 'Rating', 
            render: (item: Trainer) => item.pwtr_rating.toFixed(2)
        },
        { key: 'region_name', label: 'Region' },
        {
            key: 'title',
            label: 'Title',
            render: (item: Trainer) => (item.title !== 'None' ? item.title : ''),
        },
    ];

    return (
        <div>
            <h1>PWTR List</h1>
            <SortableTable
                columns={columns}
                data={trainers}
                itemsPerPage={20}
                withPagination={true} 
            />
        </div>
    );
};

export default TrainerList;