import React, { useState } from 'react';
import { ButtonGroup, Button } from 'react-bootstrap';
import SortableTable from '../SortableTable';
import { PokemonLearnsetProps, GenericMoveDetails } from '../../types';
import TypeBadge from './TypeBadge'; 
import '../css/Pokedex.scss';


// versionGroup -> generation mapping
const versionGroupToGenerationMap: { [key: string]: string } = {
    '1': 'Generation 1',
    '2': 'Generation 1',
    '3': 'Generation 2',
    '4': 'Generation 2',
    '5': 'Generation 3',
    '6': 'Generation 3',
    '7': 'Generation 3',
    '12': 'Generation 3',
    '13': 'Generation 3',
    '8': 'Generation 4',
    '9': 'Generation 4',
    '10': 'Generation 4',
    '11': 'Generation 5',
    '14': 'Generation 5',
    '15': 'Generation 6',
    '16': 'Generation 6',
    '17': 'Generation 7',
    '18': 'Generation 7',
    '19': 'Generation 7',
    '20': 'Generation 8',
    '21': 'Generation 8',
    '22': 'Generation 8',
    '23': 'Generation 8',
    '24': 'Generation 8',
    '25': 'Generation 9',
    '26': 'Generation 9',
    '27': 'Generation 9',
};

// Group moves by generation and version group
const groupMovesByGenerationAndVersion = (moves: GenericMoveDetails[]) => {
    const groupedByGeneration: { [generation: string]: { [versionGroup: string]: GenericMoveDetails[] } } = {};

    moves.forEach((move) => {
        const generation = versionGroupToGenerationMap[move.version_group_id.toString()];

        if (!generation) return;

        const versionGroup = move.version_group;

        if (!groupedByGeneration[generation]) {
            groupedByGeneration[generation] = {};
        }
        if (!groupedByGeneration[generation][versionGroup]) {
            groupedByGeneration[generation][versionGroup] = [];
        }

        groupedByGeneration[generation][versionGroup].push(move);
    });

    return groupedByGeneration;
};

const capitalizeMoveName = (name: string) => {
    return name.replace(/\b\w/g, char => char.toUpperCase());
};

const PokemonLearnset: React.FC<PokemonLearnsetProps> = ({ moves }) => {
    
    let defaultGeneration = 'Generation 1';
    let defaultVersionGroup = 'red-blue';

    if (moves.length > 0) {
        let latestMove = moves[0];

        moves.forEach(move => {
            if (move.version_group_id > latestMove.version_group_id) {
                latestMove = move;
            }
        });

        // Get the latest generation and version group from the latest move
        defaultGeneration = versionGroupToGenerationMap[latestMove.version_group_id.toString()];
        defaultVersionGroup = latestMove.version_group;
    }


    const [activeGeneration, setActiveGeneration] = useState<string>(defaultGeneration);
    const [activeVersionGroup, setActiveVersionGroup] = useState<string>(defaultVersionGroup);

    const groupedMoves = groupMovesByGenerationAndVersion(moves);
    //console.log('moves:', moves);
    //console.log('groupedMoves:', groupedMoves);

    const renderMovesTable = (learnMethod: string, filteredMoves: GenericMoveDetails[], title: string, fallbackMessage: string) => {
        const columns: Array<{ key: keyof GenericMoveDetails, label: string, render?: (item: GenericMoveDetails) => React.ReactNode }> = [
            { key: 'name', label: 'Move', render: (row: any) => (
                <a href={`/dex/moves/${row.id}`} style={{ textDecoration: 'none' }}>
                    {capitalizeMoveName(row.name)}
                </a>
            )},
            { key: 'type', label: 'Type', render: (row: any) => <TypeBadge type={row.type} /> },
            { key: 'damage_class', label: 'Cat.', render: (item: GenericMoveDetails) => {
                const imagePath = `/icons/${item.damage_class.toLowerCase()}.png`;
                return <img src={imagePath} alt={item.damage_class} style={{ width: '24px', height: '24px' }} />;
            }},
            { key: 'power', label: 'Power', render: (item: GenericMoveDetails) => item.power ? item.power : '-' },
            { key: 'accuracy', label: 'Acc.', render: (item: GenericMoveDetails) => item.accuracy ? item.accuracy : '-' },
            { key: 'pp', label: 'PP' },
        ];

        if (learnMethod === 'level-up') {
            columns.unshift({ key: 'level_learned_at', label: 'Lvl' });
        }

        /*
        if (learnMethod === 'machine') {
            columns.push({ key: 'machine', label: 'TM' });
        }*/

        return (
            <>
                <h4>{title}</h4>
                {filteredMoves.length > 0 ? (
                    <SortableTable
                        columns={columns}
                        data={filteredMoves}
                    />
                ) : (
                    <p>{fallbackMessage}</p>
                )}
            </>
        );
    };

    const renderVersionGroupLinks = (versionGroups: { [versionGroup: string]: GenericMoveDetails[] }) => (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <ButtonGroup>
                {Object.keys(versionGroups).map((versionGroup) => (
                    <Button
                        key={versionGroup}
                        variant={versionGroup === activeVersionGroup ? 'primary' : 'light'}
                        onClick={() => setActiveVersionGroup(versionGroup)}
                    >
                        {versionGroup.charAt(0).toUpperCase() + versionGroup.slice(1)}
                    </Button>
                ))}
            </ButtonGroup>
        </div>
    );

    const renderGenerationContent = (generation: string, versionGroups: { [versionGroup: string]: GenericMoveDetails[] }) => {
        //console.log('versionGroups:', versionGroups);
        const versionGroupContent = versionGroups[activeVersionGroup] || [];
    
        // Filter moves by learn method
        const levelUpMoves = versionGroupContent
            .filter(move => move.learn_method === 'level-up' && move.level_learned_at !== 0)
            .sort((a, b) => a.level_learned_at - b.level_learned_at);
        const evolutionMoves = versionGroupContent.filter(move => move.learn_method === 'level-up' && move.level_learned_at === 0);
        const tutorMoves = versionGroupContent.filter(move => move.learn_method === 'tutor');
        const eggMoves = versionGroupContent.filter(move => move.learn_method === 'egg');
        const machineMoves = versionGroupContent
            .filter(move => move.learn_method === 'machine')
            .sort((a, b) => a.name.localeCompare(b.name));
    
        return (
            <div>
                {renderVersionGroupLinks(versionGroups)}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1, marginRight: '30px' }}>
                        {renderMovesTable('level-up', levelUpMoves, 'Level-Up Moves', 'Does not learn any moves by leveling up')}
                        {renderMovesTable('evolution', evolutionMoves, 'Moves Learned on Evolution', 'Does not learn any moves on evolution')}
                        {renderMovesTable('tutor', tutorMoves, 'Move Tutor', 'Does not learn any moves by tutor')}
                        {renderMovesTable('egg', eggMoves, 'Egg Moves', 'Does not learn any moves by egg')}
                    </div>
                    <div style={{ flex: 1 }}>
                        {renderMovesTable('machine', machineMoves, 'Machine Moves', 'Does not learn any moves by machine')}
                    </div>
                </div>
            </div>
        );
    };

    const renderGenerationLinks = () => {
        const sortedGenerations = Object.keys(groupedMoves).sort();
    
        return (
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                {sortedGenerations.map((generation, index) => {
                    const generationNumber = generation.replace('Generation ', '');
                    return (
                        <React.Fragment key={index}>
                            <span
                                onClick={() => {
                                    setActiveGeneration(generation);
                                    const firstVersionGroup = Object.keys(groupedMoves[generation])[0];
                                    setActiveVersionGroup(firstVersionGroup);
                                }}
                                style={{
                                    cursor: 'pointer',
                                    fontWeight: activeGeneration === generation ? 'bold' : 'normal',
                                    color: activeGeneration === generation ? 'black' : '#007bff',
                                }}
                            >
                                {generationNumber}
                            </span>
                            {index < sortedGenerations.length - 1 && <span style={{ margin: '0 10px' }}>|</span>}
                        </React.Fragment>
                    );
                })}
            </div>
        );
    };

    return (
        <div>
            {moves.length === 0 ? (
                <div>Loading...</div>
            ) : (
                <>
                    {renderGenerationLinks()}
                    {renderGenerationContent(activeGeneration, groupedMoves[activeGeneration])}
                </>
            )}
        </div>
    );
};

export default PokemonLearnset;
