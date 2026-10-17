import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Chip, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { isInactiveBrief, specialKinds, type PopulationPlan, type PopulationReview } from './populationData';

export function PopulationPlanSummary({ plan }: { plan: PopulationPlan }): React.JSX.Element {
  if (plan.inactiveCohort) return <Box sx={{ mt: 2 }}>
    <Typography variant="h6">Planned inactive cohort</Typography>
    <Typography>{plan.batch?.count} in this batch · Inactive population {plan.inactiveCohort.beforeInactive} → {plan.inactiveCohort.afterInactive}</Typography>
    <Typography>Active population remains {plan.inspection.counts.active}. No historical population target is inferred.</Typography>
    {plan.batch?.issues.map((issue) => <Alert key={issue} severity="info" sx={{ mt: 1 }}>{issue}</Alert>)}
  </Box>;
  return <Box sx={{ mt: 2 }}>
    <Typography variant="h6">Planned additions</Typography>
    <Typography>{plan.batch?.count} in this batch · {plan.batch?.projectedWorldwideActive.toLocaleString()} projected active trainers worldwide</Typography>
    {plan.batch?.issues.map((issue) => <Alert key={issue} severity="info" sx={{ mt: 1 }}>{issue}</Alert>)}
    <Accordion sx={{ mt: 1 }}><AccordionSummary>Worldwide regional and age targets</AccordionSummary><AccordionDetails>
      <Table size="small"><TableHead><TableRow><TableCell>Region</TableCell><TableCell>Remaining additions</TableCell><TableCell>Projected 3,000+ population</TableCell></TableRow></TableHead>
        <TableBody>{plan.regionalTargets?.map((region) => <TableRow key={region.regionId}><TableCell>{plan.inspection.regions.find((source) => source.id === region.regionId)?.name}</TableCell>
          <TableCell>{region.additionTarget}</TableCell><TableCell>{region.projectedActiveInCoverage}</TableCell></TableRow>)}</TableBody></Table>
      <Typography sx={{ mt: 2 }}>Age target population: {plan.ageTargets?.finalPopulation.toLocaleString()} · Outside chosen bands: {plan.ageTargets?.outsideBands} · Unknown ages: {plan.ageTargets?.invalidBirthdates}</Typography>
      <Table size="small"><TableHead><TableRow><TableCell>Ages</TableCell><TableCell>Share</TableCell><TableCell>Existing</TableCell><TableCell>Target</TableCell><TableCell>Gap</TableCell></TableRow></TableHead>
        <TableBody>{plan.ageTargets?.bands.map((band) => <TableRow key={`${band.minimum}-${band.maximum}`}><TableCell>{band.minimum}–{band.maximum}</TableCell><TableCell>{band.percentage}%</TableCell><TableCell>{band.existing}</TableCell><TableCell>{band.target}</TableCell><TableCell>{band.deficit}</TableCell></TableRow>)}</TableBody></Table>
    </AccordionDetails></Accordion>
  </Box>;
}
export function PopulationReviewSummary({ review }: { review: PopulationReview }): React.JSX.Element {
  const { summary, plan } = review.proposal;
  const inactive = isInactiveBrief(review.proposal.brief);
  const planningNotes = plan.batch?.issues ?? [];
  const describeChange = (change: string): string => review.proposal.trainers.reduce((text, trainer) =>
    text.replace(trainer.key, `${trainer.profile.fname} ${trainer.profile.lname}`), change);
  return <Box sx={{ mt: 2 }}>
    <Typography variant="h6">Reviewed batch summary</Typography>
    <Typography>{summary.trainerCount} trainer{summary.trainerCount === 1 ? '' : 's'} · {summary.pokemonCount} Pokémon · Active population {review.distributions.beforeActive} → {review.distributions.afterActive}</Typography>
    {inactive ? <>
      <Typography>Inactive population {review.distributions.beforeInactive} → {review.distributions.afterInactive}. Existing active elite preserved.</Typography>
      <Typography>Unknown official values: current PWTR {review.distributions.unknownOfficial?.currentPwtr}, peak PWTR {review.distributions.unknownOfficial?.peakPwtr}, peak rank {review.distributions.unknownOfficial?.peakRank}; unknown estimated peak years {review.distributions.unknownOfficial?.peakYear}.</Typography>
      <Typography variant="body2" color="text.secondary">These are current ratings and owned Pokémon. Peak years do not reconstruct past strength, rosters, participation or results.</Typography>
    </> : <Typography>{review.distributions.protectedTrainers} existing elite trainers preserved · New PWTR strictly below {review.distributions.ceilingExclusive}</Typography>}
    <Typography variant="body2" color="text.secondary">Individual inspection is optional. Confirm the whole batch after reviewing this summary and its exceptions.</Typography>
    <Table size="small" aria-label="Exceptional ownership summary"><TableHead><TableRow><TableCell>Category</TableCell><TableCell>Expected trainers</TableCell><TableCell>Actual trainers</TableCell><TableCell>Pokémon</TableCell></TableRow></TableHead>
      <TableBody>{specialKinds.map((kind) => <TableRow key={kind}><TableCell>{kind}</TableCell><TableCell>{summary.specials[kind].expectedTrainers.toFixed(2)}</TableCell><TableCell>{summary.specials[kind].actualTrainers}</TableCell><TableCell>{summary.specials[kind].pokemonCount}</TableCell></TableRow>)}</TableBody></Table>
    <Typography variant="body2" color="text.secondary">Existing ages: {plan.ageTargets?.outsideBands ?? 0} outside the chosen bands · {plan.ageTargets?.invalidBirthdates ?? 0} unknown.</Typography>
    {review.changes.map((change) => <Alert key={change} severity="info" sx={{ mt: 1 }}>{describeChange(change)}</Alert>)}
    {review.warnings.filter((warning) => !planningNotes.includes(warning)).map((warning) => <Alert key={warning} severity="warning" sx={{ mt: 1 }}>{warning}</Alert>)}
    <Accordion sx={{ mt: 1 }}><AccordionSummary>Rating / age distributions and strongest additions</AccordionSummary><AccordionDetails>
      <Typography variant="subtitle2">{inactive ? 'Current ability; no active PWTR allocation' : 'PWTR bands'}</Typography><Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>{review.distributions.ratings.filter((band) => band.count > 0).map((band) => <Chip key={band.bandId} label={`${band.bandId.replace('pwtr_', '')}+: ${band.count}`} />)}</Box>
      <Typography variant="subtitle2">Ages</Typography><Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>{review.distributions.ages.map((band) => <Chip key={`${band.minimum}-${band.maximum}`} label={`${band.minimum}–${band.maximum}: ${band.count}`} />)}<Chip label={`Outside bands: ${review.distributions.outsideAgeBands}`} /></Box>
      {review.distributions.strongest.map((trainer) => <Typography key={trainer.key}>{trainer.name} · {inactive ? `${trainer.ability} current ability · peak ${trainer.estimatedPeakAbility} · decline ${trainer.declinePoints}` : `${trainer.pwtr?.toFixed(2) ?? 'Unknown'} PWTR`}</Typography>)}
      {planningNotes.map((note) => <Typography key={note} variant="body2" color="text.secondary" sx={{ mt: 1 }}>{note}</Typography>)}
      <Typography variant="caption" display="block" sx={{ mt: 2 }}>Save: {plan.inspection.databaseFile} · {plan.inspection.gameDate}</Typography>
    </AccordionDetails></Accordion>
  </Box>;
}
