import React, { useEffect, useState } from 'react';
import axios from 'axios';

const InactiveTrainerList: React.FC = () => {
    const [trainers, setTrainers] = useState<any[]>([]);

    useEffect(() => {
        const fetchTrainers = async () => {
            try {
                const response = await axios.get('http://localhost:5000/trainers/inactive');
                setTrainers(response.data.data);
            } catch (error) {
                console.error('Error fetching trainers:', error);
            }
        };

        fetchTrainers();
    }, []);

    return (
        <div>
            <h1>Inactive Trainers</h1>
            <ul>
                {trainers.map(trainer => (
                    <li key={trainer.id}>
                        {trainer.fname} {trainer.lname}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default InactiveTrainerList;
