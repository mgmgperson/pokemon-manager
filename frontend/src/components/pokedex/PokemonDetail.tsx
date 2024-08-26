import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Container, Tabs, Tab } from 'react-bootstrap';
import PokemonBasicInfo from './PokemonBasicInfo';
import PokemonLearnset from './PokemonLearnset';
import PokemonSprites from './PokemonSprites';
import PokemonEntries from './PokemonEntries';
import { PokemonForm, PokemonSpecies, GenericMoveDetails } from '../../types';
import PokemonLocations from './PokemonLocations';

const capitalize = (name: string) => {
    return name.replace(/\b\w/g, char => char.toUpperCase());
};

const fetchPokemonForm = async (id: string): Promise<PokemonForm> => {
    const { data } = await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}/`);
    return data;
};

const fetchPokemonSpecies = async (url: string): Promise<PokemonSpecies> => {
    const { data } = await axios.get(url);
    return data;
};

const fetchMoveDetails = async (url: string) => {
    const { data } = await axios.get(url);
    return data;
};

const fetchEvolutionChain = async (url: string) => {
    const { data } = await axios.get(url);
    return data;
}

const PokemonDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    const { data: pokemonForm2, isLoading: isLoadingForm, error: formError } = useQuery({
        queryKey: ['pokemonForm', id],
        queryFn: () => fetchPokemonForm(id!),
        enabled: !!id,
    });

    const speciesUrl = pokemonForm2?.species.url;
    const { data: pokemonSpecies2, isLoading: isLoadingSpecies, error: speciesError } = useQuery({
        queryKey: ['pokemonSpecies', speciesUrl],
        queryFn: () => fetchPokemonSpecies(speciesUrl!),
        enabled: !!speciesUrl,
    });

    const moveUrls = pokemonForm2?.moves.map((move: any) => move.move.url) ?? [];
    const { data: moveDetailsArray = [], isLoading: isLoadingMoves, error: movesError } = useQuery({
        queryKey: ['moveDetails', moveUrls],
        queryFn: () =>
            Promise.all(
                moveUrls.map((url) => fetchMoveDetails(url))
            ),
        enabled: !!pokemonForm2?.moves,
    });

    const evolutionChainUrl = pokemonSpecies2?.evolution_chain.url;
    const { data: evolutionChainData } = useQuery({
        queryKey: ['evolution', evolutionChainUrl],
        queryFn: () => fetchEvolutionChain(evolutionChainUrl!),
        enabled: !!evolutionChainUrl,
    });

    if (isLoadingForm || isLoadingSpecies || isLoadingMoves) {
        return <div>Loading...</div>;
    }

    if (formError || speciesError || movesError) {
        return <div>Error loading data: {formError?.message || speciesError?.message || movesError?.message}</div>;
    }

    const moveDataMap2: { [key: string]: any } = {};
    moveDetailsArray.forEach((moveData: any) => {
        moveDataMap2[moveData.name] = {
            id: moveData.id,
            power: moveData.power,
            accuracy: moveData.accuracy,
            pp: moveData.pp,
            damage_class: moveData.damage_class.name,
            type: moveData.type.name,
            past_values: moveData.past_values,
            machines: moveData.machines
        };
    });

    const flattenedMoves2 = pokemonForm2?.moves.flatMap((move: any) =>
        move.version_group_details.map((detail: any) => ({
            name: move.move.name,
            version_group: detail.version_group.name,
            version_group_id: parseInt(detail.version_group.url.split('/').slice(-2, -1)[0]),
            level_learned_at: detail.level_learned_at,
            learn_method: detail.move_learn_method.name,
        }))
    );

    const moveDetailsArray2: GenericMoveDetails[] = [];

    for (const move of flattenedMoves2??[]) {

        const moveData = moveDataMap2[move.name];
        let { id, power, accuracy, pp, type, damage_class } = moveData;

        // Check past_values to adjust the move details based on the version group
        moveData.past_values.forEach((pastValue: any) => {
            const pastVersionId = parseInt(pastValue.version_group.url.split('/').slice(-2, -1)[0]);
            if (move.version_group_id < pastVersionId) {
                if (pastValue.power !== null) power = pastValue.power;
                if (pastValue.accuracy !== null) accuracy = pastValue.accuracy;
                if (pastValue.pp !== null) pp = pastValue.pp;
                if (pastValue.type !== null) type = pastValue.type.name;
            }
        });

        // removed machine data because too many api calls

        /*
        let machine = '';
        if (move.learn_method === 'machine') {
            const machineEntry = moveDataMap[move.name].machines.find(
                (m: any) => m.version_group.name === move.version_group
            );
            if (machineEntry) {
                const { data: machineData } = await axios.get(machineEntry.machine.url);
                machine = machineData.item.name;
            }
        }*/

        moveDetailsArray2.push({
            id: id,
            name: move.name,
            power,
            accuracy,
            pp,
            damage_class,
            type,
            level_learned_at: move.level_learned_at,
            machine: '',
            learn_method: move.learn_method,
            version_group: move.version_group,
            version_group_id: move.version_group_id,
        });
    }
    

    
    const englishGenusEntry = pokemonSpecies2?.genera.find(
        (entry: any) => entry.language.name === 'en'
    );
    const genus = englishGenusEntry ? englishGenusEntry.genus : '';

    return (
        <Container>
            <h1>
                {pokemonSpecies2?.name ? 
                    `${pokemonSpecies2.name.charAt(0).toUpperCase() + pokemonSpecies2.name.slice(1)} - #${String(pokemonSpecies2?.id).padStart(3, '0')}` 
                    : 'Loading...'}
            </h1>
            <p>
                {pokemonSpecies2?.generation.name ? capitalize(pokemonSpecies2.generation.name) : ''} - {genus}
            </p>

            <Tabs defaultActiveKey="info" className="mb-3">
                
                <Tab eventKey="info" title="Info">
                    <PokemonBasicInfo form={pokemonForm2!} species={pokemonSpecies2!} evolution_chain={evolutionChainData!.chain} />
                </Tab>
                <Tab eventKey="learnset" title="Learnset">
                    <PokemonLearnset moves={moveDetailsArray2}/>
                </Tab>
                <Tab eventKey="locations" title="Locations">
                    <PokemonLocations />
                </Tab>
                <Tab eventKey="sprites" title="Sprites">
                    <PokemonSprites sprites={pokemonForm2!.sprites} />
                </Tab>
                <Tab eventKey="entries" title="Entries">
                    <PokemonEntries entries={pokemonSpecies2!.flavor_text_entries} />
                </Tab>
            </Tabs>
        </Container>
    );
};

export default PokemonDetail;