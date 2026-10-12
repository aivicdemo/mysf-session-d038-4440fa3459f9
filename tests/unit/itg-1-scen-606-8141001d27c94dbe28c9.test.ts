import {
  estimateTCOForMigrationCandidates,
} from '../../src/logic/tco-estimation';

describe('SCEN-606: Estimation completed timestamp is later than input timestamp', () => {
  it('should set estimationCompletedAt to a time after currentTimestamp', async () => {
    const currentTimestamp = new Date('2026-10-07T10:00:00.000Z');

    const result = await estimateTCOForMigrationCandidates({
      candidateSystemIds: ['SYS-001', 'SYS-002'],
      evaluationPeriodYears: 3,
      currentTimestamp,
    });

    expect(result.tcoEstimates).toHaveLength(2);
    expect(result.anomalousValueAlerts).toEqual([]);
    expect(new Date(result.estimationCompletedAt).getTime()).toBeGreaterThan(currentTimestamp.getTime());
  });
});
