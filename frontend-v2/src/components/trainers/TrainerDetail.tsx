import React from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Paper, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, Tooltip, Button } from '@mui/material';
import { TrainerData, RatingData, fieldNamesMap } from '../../types/trainer';
import axios from 'axios';
import InactiveTrainerDetail from './InactiveTrainerDetail';

const fetchTrainer = async (id: string): Promise<TrainerData> => {
    const { data } = await axios.get(`http://localhost:5000/trainers/${id}`);
    return data.data;
};

type Order = 'asc' | 'desc';

interface HeadCell {
    id: string;
    label: string;
    numeric: boolean;
}

const createRatingData = (ratings: Record<string, number | null>): RatingData[] => {
    return Object.entries(ratings).map(([name, rating]) => ({
        name: fieldNamesMap[name] || name,
        rating: rating ?? 0
    }));
};

const RatingTable: React.FC<{
    title: string;
    overallRating?: number;
    data: RatingData[];
}> = ({ title, overallRating, data }) => {
    const [order, setOrder] = React.useState<Order>('desc');
    const [orderBy, setOrderBy] = React.useState<keyof RatingData>('rating');

    const handleRequestSort = (property: keyof RatingData) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const sortedData = React.useMemo(() => {
        return [...data].sort((a, b) => {
            const aValue = a[orderBy];
            const bValue = b[orderBy];
            if (aValue === null || bValue === null) return 0;
            if (order === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
            }
        });
    }, [data, order, orderBy]);

    return (
        <Paper className="!p-6 !bg-gray-800">
            <Typography variant="h6" className="!text-white !mb-1">
                {title}
            </Typography>
            {overallRating !== undefined && (
                <Typography variant="subtitle1" className="!text-gray-400 !mb-4">
                    Overall: {overallRating}
                </Typography>
            )}
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell 
                                className="!text-gray-400"
                                sortDirection={orderBy === 'name' ? order : false}
                            >
                                <TableSortLabel
                                    active={orderBy === 'name'}
                                    direction={orderBy === 'name' ? order : 'asc'}
                                    onClick={() => handleRequestSort('name')}
                                    className="!text-gray-400"
                                >
                                    Name
                                </TableSortLabel>
                            </TableCell>
                            <TableCell 
                                align="right" 
                                className="!text-gray-400"
                                sortDirection={orderBy === 'rating' ? order : false}
                            >
                                <TableSortLabel
                                    active={orderBy === 'rating'}
                                    direction={orderBy === 'rating' ? order : 'asc'}
                                    onClick={() => handleRequestSort('rating')}
                                    className="!text-gray-400"
                                >
                                    Rating
                                </TableSortLabel>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedData.map((row) => (
                            <TableRow 
                                key={row.name}
                                className="hover:!bg-gray-700"
                            >
                                <TableCell className="!text-white">{row.name}</TableCell>
                                <TableCell align="right" className="!text-white">
                                    {Math.round(row.rating) ?? 'N/A'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
};

const TrainerDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { data: trainerData, isLoading, error } = useQuery({
        queryKey: ['trainer', id],
        queryFn: () => fetchTrainer(id!),
        enabled: !!id,
    });
    const location = useLocation();

    if (isLoading) {
        return (
            <Box className="!flex !justify-center !items-center !h-full">
                <CircularProgress />
            </Box>
        );
    }

    if (error || !trainerData) {
        return (
            <Box className="!flex !justify-center !items-center !h-full">
                <Typography variant="h6" className="!text-white">
                    Trainer not found
                </Typography>
            </Box>
        );
    }

    if (!trainerData.trainer.active_status) {
        return <InactiveTrainerDetail trainerData={trainerData} />;
    }

    const { trainer, rating, field_rating, mental_rating, format_rating, hometowns, badges } = trainerData;

    const typeFieldData = createRatingData({
        pumped_field_rating: field_rating.pumped_field_rating,
        windy_field_rating: field_rating.windy_field_rating,
        corrosive_field_rating: field_rating.corrosive_field_rating,
        desert_field_rating: field_rating.desert_field_rating,
        cliffs_field_rating: field_rating.cliffs_field_rating,
        swarm_field_rating: field_rating.swarm_field_rating,
        haunted_field_rating: field_rating.haunted_field_rating,
        factory_field_rating: field_rating.factory_field_rating,
        infernal_field_rating: field_rating.infernal_field_rating,
        watersurface_field_rating: field_rating.watersurface_field_rating,
        grassy_field_rating: field_rating.grassy_field_rating,
        electirized_field_rating: field_rating.electirized_field_rating,
        psychic_field_rating: field_rating.psychic_field_rating,
        icy_field_rating: field_rating.icy_field_rating,
        draconidden_field_rating: field_rating.draconidden_field_rating,
        darkcavern_field_rating: field_rating.darkcavern_field_rating,
        misty_field_rating: field_rating.misty_field_rating,
        city_field_rating: field_rating.city_field_rating,
        mirror_field_rating: field_rating.mirror_field_rating,
        concertvenue_field_rating: field_rating.concertvenue_field_rating,
    });

    const mixedFieldData = createRatingData({
        crystalcavern_field_rating: field_rating.crystalcavern_field_rating,
        waterfall_field_rating: field_rating.waterfall_field_rating,
        volcanic_field_rating: field_rating.volcanic_field_rating,
        forest_field_rating: field_rating.forest_field_rating,
        flowergarden_field_rating: field_rating.flowergarden_field_rating,
        swamp_field_rating: field_rating.swamp_field_rating,
        bewitchedwoods_field_rating: field_rating.bewitchedwoods_field_rating,
        murkwatersurface_field_rating: field_rating.murkwatersurface_field_rating,
        smoky_field_rating: field_rating.smoky_field_rating,
        frozendimensional_field_rating: field_rating.frozendimensional_field_rating,
        valleyofwinds_field_rating: field_rating.valleyofwinds_field_rating,
        losthotel_field_rating: field_rating.losthotel_field_rating,
        taiga_field_rating: field_rating.taiga_field_rating,
        ashenbeach_field_rating: field_rating.ashenbeach_field_rating,
        underwater_field_rating: field_rating.underwater_field_rating,
        starlightarena_field_rating: field_rating.starlightarena_field_rating,
        snowymountain_field_rating: field_rating.snowymountain_field_rating,
    });

    const specialFieldData = createRatingData({
        bigtop_field_rating: field_rating.bigtop_field_rating,
        backalley_field_rating: field_rating.backalley_field_rating,
        neutral_field_rating: field_rating.neutral_field_rating,
        chess_field_rating: field_rating.chess_field_rating,
        deepearth_field_rating: field_rating.deepearth_field_rating,
        inverse_field_rating: field_rating.inverse_field_rating,
        glitch_field_rating: field_rating.glitch_field_rating,
        dimensional_field_rating: field_rating.dimensional_field_rating,
        colosseum_field_rating: field_rating.colosseum_field_rating,
        trickster_field_rating: field_rating.trickster_field_rating,
        fantasy_field_rating: field_rating.fantasy_field_rating,
        rainbow_field_rating: field_rating.rainbow_field_rating,
        newworld_field_rating: field_rating.newworld_field_rating,
    });

    const mentalRatingData = createRatingData({
        planning_rating: mental_rating.planning_rating,
        risk_rating: mental_rating.risk_rating,
        prediction_rating: mental_rating.prediction_rating,
        clutch_rating: mental_rating.clutch_rating,
        consistency_rating: mental_rating.consistency_rating,
        motivation_rating: mental_rating.motivation_rating,
        pokemon_knowledge_rating: mental_rating.pokemon_knowledge_rating,
        trainer_knowledge_rating: mental_rating.trainer_knowledge_rating,
        training_rating: mental_rating.training_rating,
        conditioning_rating: mental_rating.conditioning_rating,
        determination_rating: mental_rating.determination_rating,
        facilities_rating: mental_rating.facilities_rating,
        attack_rating: mental_rating.attack_rating,
        defense_rating: mental_rating.defense_rating,
        speed_rating: mental_rating.speed_rating,
        gimmick_rating: mental_rating.gimmick_rating,
    });

    const formatRatingData = createRatingData({
        singles_rating: format_rating.singles_rating,
        doubles_rating: format_rating.doubles_rating,
        tag_battle_rating: format_rating.tag_battle_rating,
        battle_factory_rating: format_rating.battle_factory_rating,
        rotation_rating: format_rating.rotation_rating,
        sixes_rating: format_rating.sixes_rating,
        threes_rating: format_rating.threes_rating,
        twos_rating: format_rating.twos_rating,
    });

    return (
        <Box className="!p-6">
            <Paper className="!p-6 !bg-gray-800">
                <Box className="!flex !justify-between !items-center !mb-6">
                    <Typography variant="h4" className="!text-white">
                        {trainer.fname} {trainer.lname}
                    </Typography>
                    <Box className="!flex !gap-2">
                        <Button
                            component={Link}
                            to={`/trainers/${id}`}
                            variant="contained"
                            className="!bg-sky-300 hover:!bg-sky-400"
                        >
                            Overview
                        </Button>
                        <Button
                            component={Link}
                            to={`/trainers/${id}/pokemon`}
                            variant="contained"
                            className="!bg-sky-300 hover:!bg-sky-400"
                        >
                            Pokemon
                        </Button>
                        <Button
                            component={Link}
                            to={`/trainers/${id}/ratings`}
                            variant="contained"
                            className="!bg-sky-300 hover:!bg-sky-400"
                        >
                            Past Ratings
                        </Button>
                        <Button
                            component={Link}
                            to={`/edit_trainer/${id}`}
                            variant="contained"
                            className="!bg-sky-300 hover:!bg-sky-400"
                        >
                            Edit
                        </Button>
                    </Box>
                </Box>
                <Box className="!flex !flex-wrap">
                    <Box className="!w-full md:!w-1/3 !pr-4">
                        <Box className="!flex !flex-wrap">
                            {/* Profile Picture Placeholder */}
                            <Box className="!w-1/2 !pr-4">
                                <div 
                                    className="!w-full !aspect-square !bg-gray-700 !rounded-lg"
                                    style={{ minHeight: '200px' }}
                                />
                            </Box>
                            {/* Trainer Details */}
                            <Box className="!w-1/2">
                                <Typography variant="subtitle1" className="!text-gray-400">
                                    Title: {trainer.title || 'None'}
                                </Typography>
                                <Typography variant="subtitle1" className="!text-gray-400">
                                    Birthdate: {trainer.birthdate || 'Unknown'}
                                </Typography>
                                <Typography variant="subtitle1" className="!text-gray-400">
                                    Region:{' '}
                                    <Link 
                                        to={`/regions/${trainer.region_id}`}
                                        className="!text-blue-400 hover:!text-blue-300 !no-underline"
                                    >
                                        {trainer.region_name}
                                    </Link>
                                </Typography>
                                <Typography variant="subtitle1" className="!text-gray-400">
                                    Hometowns:
                                </Typography>
                                <ul className="!list-none !pl-0">
                                    {hometowns.map((hometown: { region_id: number; region_name: string; city_id: number; city_name: string }, index: number) => (
                                        <li key={index} className="!text-gray-400">
                                            <Link 
                                                to={`/regions/${hometown.region_id}`}
                                                className="!text-blue-400 hover:!text-blue-300 !no-underline"
                                            >
                                                {hometown.region_name}
                                            </Link>
                                            {' - '}
                                            <Link 
                                                to={`/cities/${hometown.city_id}`}
                                                className="!text-blue-400 hover:!text-blue-300 !no-underline"
                                            >
                                                {hometown.city_name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </Box>
                        </Box>
                    </Box>
                    <Box className="!w-full md:!w-1/6 !flex !flex-col !items-start">
                        <Tooltip title={`Peak Rank: ${trainer.peak_rank || 'N/A'}`}>
                            <div>
                                <Typography variant="subtitle1" className="!text-gray-400">
                                    Rank
                                </Typography>
                                <Typography variant="h4" className="!text-white">
                                    {trainer.rank}
                                </Typography>
                            </div>
                        </Tooltip>
                        <Tooltip title={`Peak Rating: ${trainer.peak_rating || 'N/A'}`}>
                            <div className="!mt-4">
                                <Typography variant="subtitle1" className="!text-gray-400">
                                    Rating
                                </Typography>
                                <Typography variant="h4" className="!text-white">
                                    {trainer.pwtr_rating ?? 'Unrated'}
                                </Typography>
                            </div>
                        </Tooltip>
                    </Box>
                    <Box className="!w-full md:!w-1/2">
                        <Typography variant="h6" className="!text-white !mb-3">
                            Badges ({badges?.length || 0})
                        </Typography>
                        <Box className="!flex !flex-wrap !gap-2">
                            {badges && badges.length > 0 ? (
                                badges.map((badge) => (
                                    <Tooltip
                                        key={badge.badge_id}
                                        title={
                                            <Box className="!p-1">
                                                <Typography variant="subtitle2" className="!font-bold">
                                                    {badge.name}
                                                </Typography>
                                                <Typography variant="caption" className="!block !mt-1">
                                                    {badge.description}
                                                </Typography>
                                                <Typography variant="caption" className="!block !mt-1 !text-gray-300">
                                                    Awarded: {new Date(badge.awarded_at).toLocaleDateString()}
                                                </Typography>
                                            </Box>
                                        }
                                        arrow
                                        placement="top"
                                    >
                                        <Link to={`/badges/${badge.badge_id}`} className="!no-underline">
                                            <Box
                                                className="!w-12 !h-12 !bg-gray-700 !rounded !flex !items-center !justify-center !cursor-pointer hover:!bg-gray-600 !transition-colors"
                                                sx={{
                                                    border: '2px solid',
                                                    borderColor: badge.category === 'gym' ? '#fbbf24' : 
                                                                badge.category === 'conference' ? '#a78bfa' : '#6b7280'
                                                }}
                                            >
                                                {badge.image ? (
                                                    <img 
                                                        src={badge.image} 
                                                        alt={badge.name}
                                                        className="!w-full !h-full !object-cover !rounded"
                                                    />
                                                ) : (
                                                    <Typography variant="caption" className="!text-gray-400 !text-xs">
                                                        {badge.category === 'gym' ? '🏅' : 
                                                         badge.category === 'conference' ? '🏆' : '⭐'}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Link>
                                    </Tooltip>
                                ))
                            ) : (
                                <Typography variant="body2" className="!text-gray-400">
                                    No badges earned yet
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Paper>

            <Typography variant="h5" className="!text-white !mb-4 !mt-4">
                Ratings
            </Typography>
            <Typography variant="h6" className="!text-white !mb-6">
                Overall Rating: {rating.overall_rating}
            </Typography>

            <Box className="!flex !flex-wrap !gap-6 !mb-6">
                <Box className="!w-full md:!w-[calc(33.333%-16px)]">
                    <RatingTable 
                        title="Typing Field Ratings"
                        overallRating={rating.typing_rating}
                        data={typeFieldData}
                    />
                </Box>
                <Box className="!w-full md:!w-[calc(33.333%-16px)]">
                    <RatingTable 
                        title="Mixed Field Ratings"
                        overallRating={rating.mixed_rating}
                        data={mixedFieldData}
                    />
                </Box>
                <Box className="!w-full md:!w-[calc(33.333%-16px)]">
                    <RatingTable 
                        title="Special Field Ratings"
                        overallRating={rating.special_rating}
                        data={specialFieldData}
                    />
                </Box>
            </Box>

            <Box className="!flex !flex-wrap !gap-6">
                <Box className="!w-full md:!w-[calc(50%-12px)]">
                    <RatingTable 
                        title="Mental Ratings"
                        data={mentalRatingData}
                    />
                </Box>
                <Box className="!w-full md:!w-[calc(50%-12px)]">
                    <RatingTable 
                        title="Format Ratings"
                        data={formatRatingData}
                    />
                </Box>
            </Box>

            {location.pathname === `/trainers/${id}` && (
                <>
                    {/* Existing overview content */}
                </>
            )}
            {location.pathname === `/trainers/${id}/pokemon` && (
                <Typography className="!text-white">Pokemon view coming soon...</Typography>
            )}
            {location.pathname === `/trainers/${id}/ratings` && (
                <Typography className="!text-white">Past ratings view coming soon...</Typography>
            )}
        </Box>
    );
};

export default TrainerDetail; 