import React from 'react';
import { Row, Col, Table } from 'react-bootstrap';
import TypeBadge from './TypeBadge'; 
import '../css/Pokedex.scss';
import { PokemonBasicInfoProps, EvolutionChainLink } from '../../types';


const PokemonBasicInfo: React.FC<PokemonBasicInfoProps> = ({ form, species, evolution_chain }) => {
    const renderStatBars = () => {
        const statNameMapping: { [key: string]: string } = {
            hp: 'HP',
            attack: 'Attack',
            defense: 'Defense',
            'special-attack': 'Sp. Atk',
            'special-defense': 'Sp. Def',
            speed: 'Speed',
        };
    
        return form.stats.map((stat) => {
            const percentage = (stat.base_stat / 255) * 100;
            const hue = (stat.base_stat / 255) * 180; 
            const color = `hsl(${hue}, 100%, 50%)`;
    
            return (
                <div key={stat.stat.name} className="stat-bar-container">
                    <span className="stat-bar-label">{statNameMapping[stat.stat.name] || stat.stat.name}</span>
                    <span className="stat-bar-value" style={{ marginLeft: '10px', fontWeight: 'bold' }}>{stat.base_stat}</span>
                    <div className="stat-bar">
                        <div className="stat-bar-fill" style={{ width: `${percentage}%`, backgroundColor: color }} />
                    </div>
                </div>
            );
        });
    };

    const renderVarieties = () => {
        return species.varieties.map((variety) => {
            const varietyId = variety.pokemon.url.split('/').slice(-2, -1)[0];
            const isCurrentPokemon = varietyId === form.id.toString();

            return (
                <div key={variety.pokemon.url} className="variety-item">
                    <img
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${varietyId}.png`}
                        alt={variety.pokemon.name}
                        style={{ width: '35px' }}
                    />
                    {isCurrentPokemon ? (
                        <span>
                            {variety.is_default 
                                ? 'Base' 
                                : variety.pokemon.name.replace(species.name, '').replace('-', '').charAt(0).toUpperCase() + variety.pokemon.name.replace(species.name, '').replace('-', '').slice(1)}
                        </span>
                    ) : (
                        <a href={`/dex/pokemon/${varietyId}`} className="info-item">
                            {variety.is_default 
                                ? 'Base' 
                                : variety.pokemon.name.replace(species.name, '').replace('-', '').charAt(0).toUpperCase() + variety.pokemon.name.replace(species.name, '').replace('-', '').slice(1)}
                        </a>
                    )}
                </div>
            );
        });
    };
    
    const renderChain = (chainLink: EvolutionChainLink): React.ReactNode[] => {
        const evolvesTo = chainLink.evolves_to.map((evo) => renderChain(evo)).flat();
        const chainLinkId = chainLink.species.url.split('/').slice(-2, -1)[0];
        const isCurrentPokemon = chainLinkId === form.id.toString();
    
        return [
            <div key={chainLink.species.name} className="chain-item" style={{ display: 'flex', alignItems: 'center' }}>
                <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${chainLinkId}.png`}
                    alt={chainLink.species.name}
                    style={{ width: '35px', marginRight: '5px' }}
                />
                {isCurrentPokemon ? (
                    <span style={{ marginRight: '5px' }}>
                        {chainLink.species.name.charAt(0).toUpperCase() + chainLink.species.name.slice(1)}
                    </span>
                ) : (
                    <a href={`/dex/pokemon/${chainLinkId}`} className="info-item" style={{ marginRight: '5px' }}>
                        {chainLink.species.name.charAt(0).toUpperCase() + chainLink.species.name.slice(1)}
                    </a>
                )}
                {evolvesTo.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', marginLeft: '5px' }}>
                        <span style={{ marginRight: '5px' }}>→</span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {evolvesTo}
                        </div>
                    </div>
                )}
            </div>,
        ];
    };

    const renderTrainingInfo = () => (
        <Table borderless>
            <tbody>
                <tr>
                    <td>EV Yield</td>
                    <td>
                        {form.stats.map((stat) => (
                            stat.effort > 0 && (
                                <div key={stat.stat.name}>
                                    {stat.effort} {stat.stat.name.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                </div>
                            )
                        ))}
                    </td>
                </tr>
                <tr>
                    <td>Catch Rate</td>
                    <td>{species.capture_rate}</td>
                </tr>
                <tr>
                    <td>Base Happiness</td>
                    <td>{species.base_happiness}</td>
                </tr>
                <tr>
                    <td>Base Experience</td>
                    <td>{form.base_experience}</td>
                </tr>
                <tr>
                    <td>Growth Rate</td>
                    <td>{species.growth_rate.name.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</td>
                </tr>
            </tbody>
        </Table>
    );

    const renderBreedingInfo = () => (
        <Table borderless>
            <tbody>
                <tr>
                    <td>Egg Groups</td>
                    <td>
                        {species.egg_groups.map((group, idx) => (
                            <div key={idx}>{group.name.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</div>
                        ))}
                    </td>
                </tr>
                <tr>
                    <td>Gender Ratio</td>
                    <td>{species.gender_rate}</td>
                </tr>
                <tr>
                    <td>Hatch Time</td>
                    <td>{species.hatch_counter} Cycles</td>
                </tr>
            </tbody>
        </Table>
    );

    const renderGeneralInfo = () => {
        const genderRate = species.gender_rate;
        let genderContent;
    
        if (genderRate === -1) {
            genderContent = <span>Genderless</span>;
        } else {
            const femalePercentage = (genderRate / 8) * 100;
            const malePercentage = 100 - femalePercentage;
    
            genderContent = (
                <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', height: '20px', borderRadius: '5px', overflow: 'hidden' }}>
                        <div
                            style={{
                                width: `${malePercentage}%`,
                                backgroundColor: '#007bff', 
                            }}
                        ></div>
                        <div
                            style={{
                                width: `${femalePercentage}%`,
                                backgroundColor: '#ff69b4', 
                            }}
                        ></div>
                    </div>
                    <div style={{ marginTop: '5px', fontSize: '0.9em' }}>
                        {`${malePercentage}% male, ${femalePercentage}% female`}
                    </div>
                </div>
            );
        }
    
        return (
            <Table borderless>
                <tbody>
                    <tr style={{ paddingTop: 0 }}>
                        <td style={{ paddingTop: 0 }}>Types</td>
                        <td style={{ paddingTop: 0 }}>
                            <div className="type-buttons">
                                {form.types.map((type, idx) => (
                                    <TypeBadge key={idx} type={type.type.name} />
                                ))}
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>Abilities</td>
                        <td>
                            {form.abilities.map((ability, idx) => (
                                <div key={idx}>
                                    <a href={`/dex/abilities/${ability.ability.name}`}>
                                        {ability.ability.name.charAt(0).toUpperCase() + ability.ability.name.slice(1)}
                                    </a>
                                    {ability.is_hidden && ' (H)'}
                                </div>
                            ))}
                        </td>
                    </tr>
                    <tr>
                        <td>Height</td>
                        <td>{form.height} m</td>
                    </tr>
                    <tr>
                        <td>Weight</td>
                        <td>{form.weight} kg</td>
                    </tr>
                    <tr>
                        <td>Gender Ratio</td>
                        <td>{genderContent}</td>
                    </tr>
                </tbody>
            </Table>
        );
    };
    
    
    const hasMultipleVarieties = species.varieties.length > 1;
    //console.log('evolution_chain:', evolution_chain);
    const hasMultipleEvolutions = evolution_chain.evolves_to.length > 0;

    return (
        <Row>
            <Col md={4}>
                <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${form.id}.png`}
                    alt={form.name}
                    style={{ width: '100%' }}
                />
                {hasMultipleVarieties && (
                    <>
                        <h4>Formes</h4>
                        <div className="varieties-container">
                            {renderVarieties()}
                        </div>
                    </>
                )}
                {hasMultipleEvolutions ? (
                    <>
                        <h4>Evolution</h4>
                        <div className="chain-container">
                            {renderChain(evolution_chain)}
                        </div>
                    </>
                ) : (
                    <>
                        <h4>Evolution</h4>
                        <p>Does not evolve</p>
                    </>
                )}
            </Col>
            <Col md={8}>
                <Table borderless>
                    <tbody>
                        <tr>
                            <td>
                                <h2>Base Stats</h2>
                                {renderStatBars()}
                            </td>
                            <td>
                                <h2>General Info</h2>
                                {renderGeneralInfo()}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <h2>Training</h2>
                                {renderTrainingInfo()}
                            </td>
                            <td>
                                <h2>Breeding</h2>
                                {renderBreedingInfo()}
                            </td>
                        </tr>
                    </tbody>
                </Table>
            </Col>
        </Row>
    );
};

export default PokemonBasicInfo;
