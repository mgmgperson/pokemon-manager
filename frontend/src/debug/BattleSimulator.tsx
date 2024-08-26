import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface Trainer {
    id: number;
    fname: string;
    lname: string;
    rating: number;
}

const fetchTrainers = async () => {
    const { data } = await axios.get('http://localhost:5000/trainers'); // Replace with your trainer API endpoint
    return data.data;
};

const simulateBattle = async (trainer1Id: number, trainer2Id: number) => {
    const { data } = await axios.get(`http://localhost:18080/simulate-battle/${trainer1Id}/${trainer2Id}`);
    return data;
};

const BattleSimulator: React.FC = () => {
    const [trainer1, setTrainer1] = useState<number | null>(null);
    const [trainer2, setTrainer2] = useState<number | null>(null);
    const [battleResult, setBattleResult] = useState<any>(null);

    const { data: trainers = [], isLoading } = useQuery<Trainer[]>({
        queryKey: ['trainers'],
        queryFn: fetchTrainers,
    });
    

    const handleSimulate = async () => {
        if (trainer1 && trainer2) {
            const result = await simulateBattle(trainer1, trainer2);
            setBattleResult(result);
        }
    };

    if (isLoading) return <div>Loading...</div>;


    return (
        <div>
            <h1>Simulate a Battle</h1>
            <div>
                <label>Select Trainer 1: </label>
                <select onChange={(e) => setTrainer1(Number(e.target.value))}>
                    <option value="">-- Select Trainer --</option>
                    {trainers.map((trainer, index) => (
                        <option key={`${trainer.id}-${index}`} value={trainer.id}>
                            {trainer.fname} {trainer.lname}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label>Select Trainer 2: </label>
                <select onChange={(e) => setTrainer2(Number(e.target.value))}>
                    <option value="">-- Select Trainer --</option>
                    {trainers.map((trainer, index) => (
                        <option key={`${trainer.id}-${index}`} value={trainer.id}>
                            {trainer.fname} {trainer.lname}
                        </option>
                    ))}
                </select>
            </div>
            <button onClick={handleSimulate}>Simulate Battle</button>

            {battleResult && (
                <div>
                    <h2>Battle Result:</h2>
                    <p>Winner: {battleResult.winner}</p>
                    <p>{battleResult.trainer1_name} (Rating: {battleResult.trainer1_rating}) vs {battleResult.trainer2_name} (Rating: {battleResult.trainer2_rating})</p>
                </div>
            )}
        </div>
    );
};

export default BattleSimulator;
