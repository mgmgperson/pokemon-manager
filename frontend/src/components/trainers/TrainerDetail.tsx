import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Container, Row, Col, Dropdown, Image, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { TrainerData } from '../../types';
import SortableTable from '../SortableTable';

const fieldNamesMap: { [key: string]: string } = {
    pumped_field_rating: 'Pumped',
    windy_field_rating: 'Windy',
    corrosive_field_rating: 'Corrosive',
    desert_field_rating: 'Desert',
    cliffs_field_rating: 'Cliffs',
    swarm_field_rating: 'Swarm',
    haunted_field_rating: 'Haunted',
    factory_field_rating: 'Factory',
    infernal_field_rating: 'Infernal',
    watersurface_field_rating: 'Water Surface',
    grassy_field_rating: 'Grassy',
    electirized_field_rating: 'Electrified',
    psychic_field_rating: 'Psychic',
    icy_field_rating: 'Icy',
    draconidden_field_rating: 'Draconid Den',
    darkcavern_field_rating: 'Dark Cavern',
    misty_field_rating: 'Misty',
    city_field_rating: 'City',
    mirror_field_rating: 'Mirror',
    concertvenue_field_rating: 'Concert Venue',
    crystalcavern_field_rating: 'Crystal Cavern',
    waterfall_field_rating: 'Waterfall',
    volcanic_field_rating: 'Volcanic',
    forest_field_rating: 'Forest',
    flowergarden_field_rating: 'Flower Garden',
    swamp_field_rating: 'Swamp',
    bewitchedwoods_field_rating: 'Bewitched Woods',
    murkwatersurface_field_rating: 'Murkwater Surface',
    smoky_field_rating: 'Smoky',
    frozendimensional_field_rating: 'Frozen Dimensional',
    valleyofwinds_field_rating: 'Valley of Winds',
    losthotel_field_rating: 'Lost Hotel',
    taiga_field_rating: 'Taiga',
    ashenbeach_field_rating: 'Ashen Beach',
    underwater_field_rating: 'Underwater',
    starlightarena_field_rating: 'Starlight Arena',
    snowymountain_field_rating: 'Snowy Mountain',
    bigtop_field_rating: 'Big Top',
    backalley_field_rating: 'Back Alley',
    neutral_field_rating: 'Neutral',
    chess_field_rating: 'Chess',
    deepearth_field_rating: 'Deep Earth',
    inverse_field_rating: 'Inverse',
    glitch_field_rating: 'Glitch',
    dimensional_field_rating: 'Dimensional',
    colosseum_field_rating: 'Colosseum',
    trickster_field_rating: 'Trickster',
    fantasy_field_rating: 'Fantasy',
    rainbow_field_rating: 'Rainbow',
    newworld_field_rating: 'New World'
};

const fetchTrainer = async (id: string) => {
    const { data } = await axios.get(`http://localhost:5000/trainers/${id}`);
    return data.data;
};

const createTableData = (ratingsObj: any) => {
    return Object.keys(ratingsObj)
        .filter((key) => key !== 'id' && key !== 'rating_id')
        .map((key) => {
            let formattedField = key.replace(/_rating$/, '').replace(/_/g, ' ').trim();
            formattedField = formattedField.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' '); 
            return {
                field: fieldNamesMap[key] || formattedField,
                rating: ratingsObj[key] ?? 'N/A',
            };
        })
        .sort((a, b) => (b.rating === 'N/A' ? -1 : (a.rating === 'N/A' ? 1 : b.rating - a.rating))); // Sort by rating by default
};


const TrainerDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { data: trainerData, isLoading } = useQuery<TrainerData>({
        queryKey: ['trainer', id],
        queryFn: () => fetchTrainer(id!),
    });

    if (isLoading) return <div>Loading...</div>;

    const trainer = trainerData!.trainer;
    const hometowns = trainerData!.hometowns;
    const rating = trainerData!.rating;
    const fieldRating = trainerData!.field_rating;

    const typeFieldData = createTableData({
        pumped_field_rating: fieldRating.pumped_field_rating,
        windy_field_rating: fieldRating.windy_field_rating,
        corrosive_field_rating: fieldRating.corrosive_field_rating,
        desert_field_rating: fieldRating.desert_field_rating,
        cliffs_field_rating: fieldRating.cliffs_field_rating,
        swarm_field_rating: fieldRating.swarm_field_rating,
        haunted_field_rating: fieldRating.haunted_field_rating,
        factory_field_rating: fieldRating.factory_field_rating,
        infernal_field_rating: fieldRating.infernal_field_rating,
        watersurface_field_rating: fieldRating.watersurface_field_rating,
        grassy_field_rating: fieldRating.grassy_field_rating,
        electirized_field_rating: fieldRating.electirized_field_rating,
        psychic_field_rating: fieldRating.psychic_field_rating,
        icy_field_rating: fieldRating.icy_field_rating,
        draconidden_field_rating: fieldRating.draconidden_field_rating,
        darkcavern_field_rating: fieldRating.darkcavern_field_rating,
        misty_field_rating: fieldRating.misty_field_rating,
        city_field_rating: fieldRating.city_field_rating,
        mirror_field_rating: fieldRating.mirror_field_rating,
        concertvenue_field_rating: fieldRating.concertvenue_field_rating,
    });

    const mixedFieldData = createTableData({
        crystalcavern_field_rating: fieldRating.crystalcavern_field_rating,
        waterfall_field_rating: fieldRating.waterfall_field_rating,
        volcanic_field_rating: fieldRating.volcanic_field_rating,
        forest_field_rating: fieldRating.forest_field_rating,
        flowergarden_field_rating: fieldRating.flowergarden_field_rating,
        swamp_field_rating: fieldRating.swamp_field_rating,
        bewitchedwoods_field_rating: fieldRating.bewitchedwoods_field_rating,
        murkwatersurface_field_rating: fieldRating.murkwatersurface_field_rating,
        smoky_field_rating: fieldRating.smoky_field_rating,
        frozendimensional_field_rating: fieldRating.frozendimensional_field_rating,
        valleyofwinds_field_rating: fieldRating.valleyofwinds_field_rating,
        losthotel_field_rating: fieldRating.losthotel_field_rating,
        taiga_field_rating: fieldRating.taiga_field_rating,
        ashenbeach_field_rating: fieldRating.ashenbeach_field_rating,
        underwater_field_rating: fieldRating.underwater_field_rating,
        starlightarena_field_rating: fieldRating.starlightarena_field_rating,
        snowymountain_field_rating: fieldRating.snowymountain_field_rating,
    });

    const specialFieldData = createTableData({
        bigtop_field_rating: fieldRating.bigtop_field_rating,
        backalley_field_rating: fieldRating.backalley_field_rating,
        neutral_field_rating: fieldRating.neutral_field_rating,
        chess_field_rating: fieldRating.chess_field_rating,
        deepearth_field_rating: fieldRating.deepearth_field_rating,
        inverse_field_rating: fieldRating.inverse_field_rating,
        glitch_field_rating: fieldRating.glitch_field_rating,
        dimensional_field_rating: fieldRating.dimensional_field_rating,
        colosseum_field_rating: fieldRating.colosseum_field_rating,
        trickster_field_rating: fieldRating.trickster_field_rating,
        fantasy_field_rating: fieldRating.fantasy_field_rating,
        rainbow_field_rating: fieldRating.rainbow_field_rating,
        newworld_field_rating: fieldRating.newworld_field_rating,
    });

    const fieldRatingCols: Array<{ key: 'field' | 'rating'; label: string }> = [
        { key: 'field', label: 'Field' },
        { key: 'rating', label: 'Rating' },
    ];
    
    /*    
    const typeRating = {
        id: fieldRating.id,
        rating_id: fieldRating.rating_id,
        pumped_field_rating: fieldRating.pumped_field_rating,
        windy_field_rating: fieldRating.windy_field_rating,
        corrosive_field_rating: fieldRating.corrosive_field_rating,
        desert_field_rating: fieldRating.desert_field_rating,
        cliffs_field_rating: fieldRating.cliffs_field_rating,
        swarm_field_rating: fieldRating.swarm_field_rating,
        haunted_field_rating: fieldRating.haunted_field_rating,
        factory_field_rating: fieldRating.factory_field_rating,
        infernal_field_rating: fieldRating.infernal_field_rating,
        watersurface_field_rating: fieldRating.watersurface_field_rating,
        grassy_field_rating: fieldRating.grassy_field_rating,
        electirized_field_rating: fieldRating.electirized_field_rating,
        psychic_field_rating: fieldRating.psychic_field_rating,
        icy_field_rating: fieldRating.icy_field_rating,
        draconidden_field_rating: fieldRating.draconidden_field_rating,
        darkcavern_field_rating: fieldRating.darkcavern_field_rating,
        misty_field_rating: fieldRating.misty_field_rating,
        city_field_rating: fieldRating.city_field_rating,
        mirror_field_rating: fieldRating.mirror_field_rating,
        concertvenue_field_rating: fieldRating.concertvenue_field_rating,
    };

    const typeRatingCols: Array<{ key: keyof typeof typeRating, label: string }> = [
        { key: 'pumped_field_rating', label: 'Pumped' },
        { key: 'windy_field_rating', label: 'Windy' },
        { key: 'corrosive_field_rating', label: 'Corrosive' },
        { key: 'desert_field_rating', label: 'Desert' },
        { key: 'cliffs_field_rating', label: 'Cliffs' },
        { key: 'swarm_field_rating', label: 'Swarm' },
        { key: 'haunted_field_rating', label: 'Haunted' },
        { key: 'factory_field_rating', label: 'Factory' },
        { key: 'infernal_field_rating', label: 'Infernal' },
        { key: 'watersurface_field_rating', label: 'Water Surface' },
        { key: 'grassy_field_rating', label: 'Grassy' },
        { key: 'electirized_field_rating', label: 'Electirized' },
        { key: 'psychic_field_rating', label: 'Psychic' },
        { key: 'icy_field_rating', label: 'Icy' },
        { key: 'draconidden_field_rating', label: 'Draconid Den' },
        { key: 'darkcavern_field_rating', label: 'Dark Cavern' },
        { key: 'misty_field_rating', label: 'Misty' },
        { key: 'city_field_rating', label: 'City' },
        { key: 'mirror_field_rating', label: 'Mirror' },
        { key: 'concertvenue_field_rating', label: 'Concert Venue' },
    ];


    const mixedRating = {
        id: fieldRating.id,
        rating_id: fieldRating.rating_id,
        crystalcavern_field_rating: fieldRating.crystalcavern_field_rating,
        waterfall_field_rating: fieldRating.waterfall_field_rating,
        volcanic_field_rating: fieldRating.volcanic_field_rating,
        forest_field_rating: fieldRating.forest_field_rating,
        flowergarden_field_rating: fieldRating.flowergarden_field_rating,
        swamp_field_rating: fieldRating.swamp_field_rating,
        bewitchedwoods_field_rating: fieldRating.bewitchedwoods_field_rating,
        murkwatersurface_field_rating: fieldRating.murkwatersurface_field_rating,
        smoky_field_rating: fieldRating.smoky_field_rating,
        frozendimensional_field_rating: fieldRating.frozendimensional_field_rating,
        valleyofwinds_field_rating: fieldRating.valleyofwinds_field_rating,
        losthotel_field_rating: fieldRating.losthotel_field_rating,
        taiga_field_rating: fieldRating.taiga_field_rating,
        ashenbeach_field_rating: fieldRating.ashenbeach_field_rating,
        underwater_field_rating: fieldRating.underwater_field_rating,
        starlightarena_field_rating: fieldRating.starlightarena_field_rating,
        snowymountain_field_rating: fieldRating.snowymountain_field_rating,
    };

    const mixedRatingCols: Array<{ key: keyof typeof mixedRating, label: string }> = [
        { key: 'crystalcavern_field_rating', label: 'Crystal Cavern' },
        { key: 'waterfall_field_rating', label: 'Waterfall' },
        { key: 'volcanic_field_rating', label: 'Volcanic' },
        { key: 'forest_field_rating', label: 'Forest' },
        { key: 'flowergarden_field_rating', label: 'Flower Garden' },
        { key: 'swamp_field_rating', label: 'Swamp' },
        { key: 'bewitchedwoods_field_rating', label: 'Bewitched Woods' },
        { key: 'murkwatersurface_field_rating', label: 'Murkwater Surface' },
        { key: 'smoky_field_rating', label: 'Smoky' },
        { key: 'frozendimensional_field_rating', label: 'Frozen Dimensional' },
        { key: 'valleyofwinds_field_rating', label: 'Valley of Winds' },
        { key: 'losthotel_field_rating', label: 'Lost Hotel' },
        { key: 'taiga_field_rating', label: 'Taiga' },
        { key: 'ashenbeach_field_rating', label: 'Ashen Beach' },
        { key: 'underwater_field_rating', label: 'Underwater' },
        { key: 'starlightarena_field_rating', label: 'Starlight Arena' },
        { key: 'snowymountain_field_rating', label: 'Snowy Mountain' },
    ];

    const specialRating = {
        id: fieldRating.id,
        rating_id: fieldRating.rating_id,
        bigtop_field_rating: fieldRating.bigtop_field_rating,
        backalley_field_rating: fieldRating.backalley_field_rating,
        neutral_field_rating: fieldRating.neutral_field_rating,
        chess_field_rating: fieldRating.chess_field_rating,
        deepearth_field_rating: fieldRating.deepearth_field_rating,
        inverse_field_rating: fieldRating.inverse_field_rating,
        glitch_field_rating: fieldRating.glitch_field_rating,
        dimensional_field_rating: fieldRating.dimensional_field_rating,
        colosseum_field_rating: fieldRating.colosseum_field_rating,
        trickster_field_rating: fieldRating.trickster_field_rating,
        fantasy_field_rating: fieldRating.fantasy_field_rating,
        rainbow_field_rating: fieldRating.rainbow_field_rating,
        newworld_field_rating: fieldRating.newworld_field_rating,
    };

    const specialRatingCols: Array<{ key: keyof typeof specialRating, label: string }> = [
        { key: 'bigtop_field_rating', label: 'Big Top' },
        { key: 'backalley_field_rating', label: 'Back Alley' },
        { key: 'neutral_field_rating', label: 'Neutral' },
        { key: 'chess_field_rating', label: 'Chess' },
        { key: 'deepearth_field_rating', label: 'Deep Earth' },
        { key: 'inverse_field_rating', label: 'Inverse' },
        { key: 'glitch_field_rating', label: 'Glitch' },
        { key: 'dimensional_field_rating', label: 'Dimensional' },
        { key: 'colosseum_field_rating', label: 'Colosseum' },
        { key: 'trickster_field_rating', label: 'Trickster' },
        { key: 'fantasy_field_rating', label: 'Fantasy' },
        { key: 'rainbow_field_rating', label: 'Rainbow' },
        { key: 'newworld_field_rating', label: 'New World' },
    ];*/

    
    const mentalRatingData = createTableData({
        planning_rating: trainerData!.mental_rating.planning_rating,
        risk_rating: trainerData!.mental_rating.risk_rating,
        prediction_rating: trainerData!.mental_rating.prediction_rating,
        clutch_rating: trainerData!.mental_rating.clutch_rating,
        consistency_rating: trainerData!.mental_rating.consistency_rating,
        motivation_rating: trainerData!.mental_rating.motivation_rating,
        pokemon_knowledge_rating: trainerData!.mental_rating.pokemon_knowledge_rating,
        trainer_knowledge_rating: trainerData!.mental_rating.trainer_knowledge_rating,
        training_rating: trainerData!.mental_rating.training_rating,
        conditioning_rating: trainerData!.mental_rating.conditioning_rating,
        determination_rating: trainerData!.mental_rating.determination_rating,
        facilities_rating: trainerData!.mental_rating.facilities_rating,
        attack_rating: trainerData!.mental_rating.attack_rating,
        defense_rating: trainerData!.mental_rating.defense_rating,
        speed_rating: trainerData!.mental_rating.speed_rating,
        gimmick_rating: trainerData!.mental_rating.gimmick_rating,
    });

    /*
    const mentalRatingCols: Array<{ key: keyof typeof mentalRating, label: string }> = [
        { key: 'planning_rating', label: 'Planning' },
        { key: 'risk_rating', label: 'Risk' },
        { key: 'prediction_rating', label: 'Prediction' },
        { key: 'clutch_rating', label: 'Clutch' },
        { key: 'consistency_rating', label: 'Consistency' },
        { key: 'motivation_rating', label: 'Motivation' },
        { key: 'pokemon_knowledge_rating', label: 'Pokemon Knowledge' },
        { key: 'trainer_knowledge_rating', label: 'Trainer Knowledge' },
        { key: 'training_rating', label: 'Training' },
        { key: 'conditioning_rating', label: 'Conditioning' },
        { key: 'determination_rating', label: 'Determination' },
        { key: 'facilities_rating', label: 'Facilities' },
        { key: 'attack_rating', label: 'Attack' },
        { key: 'defense_rating', label: 'Defense' },
        { key: 'speed_rating', label: 'Speed' },
        { key: 'gimmick_rating', label: 'Gimmick' },
    ];*/


    const formatRatingData = createTableData({
        singles_rating: trainerData!.format_rating.singles_rating,
        doubles_rating: trainerData!.format_rating.doubles_rating,
        tag_battle_rating: trainerData!.format_rating.tag_battle_rating,
        battle_factory_rating: trainerData!.format_rating.battle_factory_rating,
        rotation_rating: trainerData!.format_rating.rotation_rating,
        sixes_rating: trainerData!.format_rating.sixes_rating,
        threes_rating: trainerData!.format_rating.threes_rating,
        twos_rating: trainerData!.format_rating.twos_rating,
    });

    /*
    const formatRatingCols: Array<{ key: keyof typeof formatRating, label: string }> = [
        { key: 'singles_rating', label: 'Singles' },
        { key: 'doubles_rating', label: 'Doubles' },
        { key: 'tag_battle_rating', label: 'Tag Battle' },
        { key: 'battle_factory_rating', label: 'Battle Factory' },
        { key: 'rotation_rating', label: 'Rotation' },
        { key: 'sixes_rating', label: 'Sixes' },
        { key: 'threes_rating', label: 'Threes' },
        { key: 'twos_rating', label: 'Twos' },
    ];*/

    const ratingCols: Array<{ key: 'field' | 'rating'; label: string }> = [
        { key: 'field', label: 'Attribute' },
        { key: 'rating', label: 'Rating' },
    ];

    return (
        <Container className="mt-4">
            {/* Top header with name and dropdown */}
            <Row className="align-items-center mb-3">
                <Col>
                    <h1>{trainer.fname} {trainer.lname}</h1>
                </Col>
                <Col xs="auto">
                    <Dropdown>
                        <Dropdown.Toggle variant="secondary" id="dropdown-basic">
                            Overview
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                            <Dropdown.Item as={Link} to={`/trainers/${id}`}>Overview</Dropdown.Item>
                            <Dropdown.Item as={Link} to={`/trainers/${id}/pokemon`}>Pokemon</Dropdown.Item>
                            <Dropdown.Item as={Link} to={`/trainers/${id}/ratings`}>Past Ratings</Dropdown.Item>
                            <Dropdown.Item as={Link} to={`/edit_trainer/${id}`}>Edit</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </Col>
            </Row>

            {/* Profile section with picture and details */}
            <Row>
                {/* Column for Trainer Image and Details */}
                <Col xs={12} sm={12} md={4} className="d-flex align-items-start">
                    {/* Image Column */}
                    <Col xs={3} sm={3} md={6} className="d-flex align-items-center">
                        <div 
                            style={{
                                width: '150px',
                                height: '150px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '8px',
                                marginRight: '1rem',
                            }}
                        />
                    </Col>

                    {/* Details Column */}
                    <Col xs={9} sm={9} md={8} className="d-flex flex-column">
                        <div>
                            <p className="mb-2"><strong>Title:</strong> {trainer.title || 'None'}</p>
                            <p className="mb-2"><strong>Birthdate:</strong> {trainer.birthdate || 'Unknown'}</p>
                            <p className="mb-2"><strong>Age:</strong> Placeholder</p>
                            <p className="mb-2">
                                <strong>Region:</strong>{' '}
                                <Link to={`/regions/${trainer.region_id}`}>{trainer.region_name}</Link>
                            </p>
                            <p className="mb-0"><strong>Hometowns:</strong></p>
                            <ul className="list-unstyled">
                                {hometowns.map((hometown, index) => (
                                    <li key={index}>
                                        <Link to={`/regions/${hometown.region_id}`}>{hometown.region_name}</Link>{' '}
                                        -{' '}
                                        <Link to={`/cities/${hometown.city_id}`}>{hometown.city_name}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </Col>
                </Col>

                {/* Column for Rank and Rating */}
                <Col xs={12} sm={12} md={2} className="d-flex flex-column justify-content-start">
                    <div className="mb-3 text-start">
                        <OverlayTrigger
                            placement="top"
                            overlay={
                                <Tooltip>
                                    Peak Rank: {trainer.peak_rank || 'N/A'}
                                </Tooltip>
                            }
                        >
                            <div>
                                <p className="mb-1"><strong>Rank</strong></p>
                                <h2>{trainer.rank}</h2>
                            </div>
                        </OverlayTrigger>
                    </div>
                    <div className="text-start">
                        <OverlayTrigger
                            placement="top"
                            overlay={
                                <Tooltip>
                                    Peak Rating: {trainer.peak_rating ? trainer.peak_rating.toFixed(2) : 'N/A'}
                                </Tooltip>
                            }
                        >
                            <div>
                                <p className="mb-1"><strong>Rating</strong></p>
                                <h2>{trainer.pwtr_rating.toFixed(2)}</h2>
                            </div>
                        </OverlayTrigger>
                    </div>
                </Col>

                {/* Empty Column for Future Badges */}
                <Col xs={12} sm={12} md={3} className="d-flex justify-content-end">
                    {/* This space can be used for future badges */}
                </Col>
            </Row>

            {/* Ratings */}
            <h4>Ratings</h4>
            <h5>Overall Rating: {rating.overall_rating}</h5>
            {/* Field Ratings */}
            <Row>
                <Col>
                    <h4>Typing Field Ratings</h4>
                    <p>Overall: {rating.typing_rating}</p>
                    <SortableTable columns={fieldRatingCols} data={typeFieldData} />
                </Col>
                <Col>
                    <h4>Mixed Field Ratings</h4>
                    <p>Overall: {rating.mixed_rating}</p>
                    <SortableTable columns={fieldRatingCols} data={mixedFieldData} />
                </Col>
                <Col>
                    <h4>Special Field Ratings</h4>
                    <p>Overall: {rating.special_rating}</p>
                    <SortableTable columns={fieldRatingCols} data={specialFieldData} />
                </Col>
            </Row>

            {/* Mental and format ratings */}
            <Row>
                <Col>
                    <h4>Mental Ratings</h4>
                    <SortableTable columns={ratingCols} data={mentalRatingData} />
                </Col>
                <Col>
                    <h4>Format Ratings</h4>
                    <SortableTable columns={ratingCols} data={formatRatingData} />
                </Col>
            </Row>

        </Container>
    );
};

export default TrainerDetail;
