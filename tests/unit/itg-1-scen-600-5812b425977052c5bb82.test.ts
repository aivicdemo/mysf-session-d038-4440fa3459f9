import {
  estimateTCOForMigrationCandidates,
  type EstimateTCOForMigrationCandidatesOutput,
} from '../../src/logic/tco-estimation';

describe('SCEN-600: TCO estimation for multiple migration candidates returns valid results', () => {
  it('should return 3-year TCO estimates with anomaly detection for multiple candidates', async () => {
    const result = await estimateTCOForMigrationCandidates({
      candidateSystemIds: ['SYS-001', 'SYS-002', 'SYS-003'],
      evaluationPeriodYears: 3,
      currentTimestamp: new Date('2026-10-07T10:00:00Z'),
    });

    expect(result.tcoEstimates).toHaveLength(3);

    expect(result.tcoEstimates[0]).toMatchObject({
      systemId: 'SYS-001',
      initialImplementationCost: 500000,
      annualLicenseCost: 150000,
      annualMaintenanceCost: 30000,
      threeYearTotalTCO: 1040000,
    });

    expect(result.tcoEstimates[1]).toMatchObject({
      systemId: 'SYS-002',
      initialImplementationCost: 700000,
      annualLicenseCost: 200000,
      annualMaintenanceCost: 40000,
      threeYearTotalTCO: 1380000,
    });

    expect(result.tcoEstimates[2]).toMatchObject({
      systemId: 'SYS-003',
      initialImplementationCost: 300000,
      annualLicenseCost: 100000,
      annualMaintenanceCost: 20000,
      threeYearTotalTCO: 660000,
    });

    expect(result.anomalousValueAlerts).toEqual([]);

    expect(new Date(result.estimationCompletedAt).getTime()).toBeGreaterThanOrEqual(
      new Date('2026-10-07T10:00:00Z').getTime(),
    );
  });
});
