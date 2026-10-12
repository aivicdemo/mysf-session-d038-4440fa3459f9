import {
  estimateTCOForMigrationCandidates,
} from '../../src/logic/tco-estimation';

describe('SCEN-605: Empty migration candidates list returns empty TCO results', () => {
  it('should return empty tcoEstimates and anomalousValueAlerts when no candidates provided', async () => {
    const result = await estimateTCOForMigrationCandidates({
      candidateSystemIds: [],
      evaluationPeriodYears: 3,
      currentTimestamp: new Date('2026-10-07T10:30:00Z'),
    });

    expect(result.tcoEstimates).toEqual([]);
    expect(result.anomalousValueAlerts).toEqual([]);
    expect(result.estimationCompletedAt).toEqual(new Date('2026-10-07T10:30:00Z'));
  });
});
