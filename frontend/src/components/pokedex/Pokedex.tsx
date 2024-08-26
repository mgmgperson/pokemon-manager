import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, Container, Row, Col, Spinner, Pagination } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import '../css/Pokedex.scss';

interface PokemonSpecies {
    name: string;
    url: string;
    number: number;
    sprite?: string;
}

//TODO: rework later with react-query

const Pokedex: React.FC = () => {
    const [allPokemonSpecies, setAllPokemonSpecies] = useState<PokemonSpecies[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(true);
    const limit = 24; 

    useEffect(() => {
        const fetchAllPokemonSpecies = async () => {
            setLoading(true);
            try {
                const speciesList: PokemonSpecies[] = [];
                let url = 'https://pokeapi.co/api/v2/pokemon-species?offset=0&limit=1000';
                
                const capitalizeAfterNonAlphabetic = (name: string) => {
                    return name.replace(/([^a-zA-Z])([a-zA-Z])/g, (match, nonAlpha, alpha) => nonAlpha + alpha.toUpperCase());
                };
    
                while (url) {
                    const response = await axios.get(url);
                    response.data.results.forEach((species: any, index: number) => {
                        const number = species.url.split('/').filter(Boolean).pop(); // Extract the Pokémon number from the URL
                        speciesList.push({
                            name: capitalizeAfterNonAlphabetic(species.name),
                            url: species.url,
                            number: parseInt(number),
                            sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${number}.png`,
                        });
                    });
                    url = response.data.next;
                }
                setAllPokemonSpecies(speciesList);
            } catch (error) {
                console.error('Error fetching Pokémon species:', error);
            }
            setLoading(false);
        };
    
        fetchAllPokemonSpecies();
    }, []);

    // Pagination
    const totalPages = Math.ceil(allPokemonSpecies.length / limit);
    const currentPokemonSpecies = allPokemonSpecies.slice(
        (currentPage - 1) * limit,
        currentPage * limit
    );

    const handlePageClick = (page: number) => {
        setCurrentPage(page);
    };

    const renderPaginationItems = () => {
        const paginationItems = [];
        const maxItemsToShow = 5; // Number of pagination items to show at a time

        if (totalPages <= maxItemsToShow) {
            for (let i = 1; i <= totalPages; i++) {
                paginationItems.push(
                    <Pagination.Item key={i} active={i === currentPage} onClick={() => handlePageClick(i)}>
                        {i}
                    </Pagination.Item>
                );
            }
        } else {
            const startPage = Math.max(1, currentPage - 2);
            const endPage = Math.min(totalPages, currentPage + 2);

            if (startPage > 1) {
                paginationItems.push(
                    <Pagination.Item key={1} onClick={() => handlePageClick(1)}>
                        1
                    </Pagination.Item>
                );
                if (startPage > 2) {
                    paginationItems.push(<Pagination.Ellipsis key="startEllipsis" />);
                }
            }

            for (let i = startPage; i <= endPage; i++) {
                paginationItems.push(
                    <Pagination.Item key={i} active={i === currentPage} onClick={() => handlePageClick(i)}>
                        {i}
                    </Pagination.Item>
                );
            }

            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    paginationItems.push(<Pagination.Ellipsis key="endEllipsis" />);
                }
                paginationItems.push(
                    <Pagination.Item key={totalPages} onClick={() => handlePageClick(totalPages)}>
                        {totalPages}
                    </Pagination.Item>
                );
            }
        }

        return paginationItems;
    };

    return (
        <Container>
            <h1>Pokedex</h1>
            <br></br>
            {loading && <Spinner animation="border" />}
            <Row>
                {currentPokemonSpecies.map((species, index) => (
                    <Col xs={12} sm={6} md={4} lg={2} key={index} className="mb-4">
                        <Card className="pokemon-card text-center">
                            <Link to={`/dex/pokemon/${species.number}`} className="text-decoration-none" style={{ color: 'inherit' }}>
                                <div className="pokemon-number">#{species.number}</div>
                                <Card.Img 
                                    variant="top" 
                                    src={species.sprite} 
                                    alt={species.name} 
                                    style={{ width: '80px', height: '80px', margin: 'auto', marginTop: '10px' }} 
                                />                                
                                <Card.Body>
                                    <Card.Title style={{ fontSize: '1rem' }}>
                                        {species.name.charAt(0).toUpperCase() + species.name.slice(1)}
                                    </Card.Title>
                                </Card.Body>
                            </Link>
                        </Card>
                    </Col>
                ))}
            </Row>
            <Pagination className="justify-content-center mt-3">
                {renderPaginationItems()}
            </Pagination>
        </Container>
    );
};

export default Pokedex;
