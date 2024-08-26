import React from 'react';
import { Table } from 'react-bootstrap';
import { FlavorTextEntry } from '../../types';

interface PokemonEntriesProps {
    entries: FlavorTextEntry[];
}

const generationMapping: { [key: string]: string } = {
    '1': 'Generation I',
    '2': 'Generation I',
    '3': 'Generation I',
    '4': 'Generation II',
    '5': 'Generation II',
    '6': 'Generation II',
    '7': 'Generation III',
    '8': 'Generation III',
    '9': 'Generation III',
    '10': 'Generation III',
    '11': 'Generation III',
    '12': 'Generation IV',
    '13': 'Generation IV',
    '14': 'Generation IV',
    '15': 'Generation IV',
    '16': 'Generation IV',
    '17': 'Generation V',
    '18': 'Generation V',
    '19': 'Generation III',
    '20': 'Generation III',
    '21': 'Generation V',
    '22': 'Generation V',
    '23': 'Generation VI',
    '24': 'Generation VI',
    '25': 'Generation VI',
    '26': 'Generation VI',
    '27': 'Generation VII',
    '28': 'Generation VII',
    '29': 'Generation VII',
    '30': 'Generation VII',
    '31': 'Generation VII',
    '32': 'Generation VII',
    '33': 'Generation VIII',
    '34': 'Generation VIII',
    '35': 'Generation VIII',
    '36': 'Generation VIII',
    '37': 'Generation VIII',
    '38': 'Generation VIII',
    '39': 'Generation VIII',
    '40': 'Generation IX',
    '41': 'Generation IX',
    '42': 'Generation IX',
    '43': 'Generation IX',
};

const capitalizeVersionName = (name: string) => {
    return name.replace(/\b\w/g, char => char.toUpperCase());
};

const getGeneration = (versionUrl: string) => {
    const versionId = versionUrl.split('/').slice(-2, -1)[0];
    return generationMapping[versionId];
};

const groupEntriesByGeneration = (entries: FlavorTextEntry[]) => {
    const generationGroups: { [key: string]: { [key: string]: string[] } } = {};

    entries.forEach((entry) => {
        const generation = getGeneration(entry.version.url);
        if (entry.language.name === 'en') {
            if (!generationGroups[generation]) {
                generationGroups[generation] = {};
            }
            const existingEntry = generationGroups[generation][entry.flavor_text];
            if (existingEntry) {
                existingEntry.push(entry.version.name);
            } else {
                generationGroups[generation][entry.flavor_text] = [entry.version.name];
            }
        }
    });

    return generationGroups;
};

const PokemonEntries: React.FC<PokemonEntriesProps> = ({ entries }) => {
    const generationGroups = groupEntriesByGeneration(entries);

    return (
        <div>
            {Object.entries(generationGroups).map(([generation, flavorTexts], genIndex) => (
                <div key={genIndex}>
                    <h4>{generation}</h4>
                    <Table bordered>
                        <tbody>
                            {Object.entries(flavorTexts).map(([flavorText, versions], index) => (
                                <tr key={index}>
                                    <td>{versions.map(version => capitalizeVersionName(version)).join(', ')}</td>
                                    <td>{flavorText.replace(/\n|\f/g, ' ')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            ))}
        </div>
    );
};

export default PokemonEntries;
