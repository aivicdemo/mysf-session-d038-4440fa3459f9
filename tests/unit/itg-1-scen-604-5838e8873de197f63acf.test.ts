import {
  estimateTCOForMigrationCandidates,
  AnomalousValuesDetected,
} from '../../src/logic/tco-estimation';

describe('SCEN-604: Anomalous values detected in TCO calculation', () => {
  it('should throw AnomalousValuesDetected error with anomaly details in payload', async () => {
    const thrownError = await estimateTCOForMigrationCandidates({
      candidateSystemIds: ['SYS-001', 'SYS-002'],
      evaluationPeriodYears: 3,
      currentTimestamp: new Date('2026-10-07T10:00:00.000Z'),
    }).catch((e) => e);

    expect(thrownError).toBeInstanceOf(AnomalousValuesDetected);
    expect(thrownError.message).toBe('TCO試算結果に異常値が検出されました。詳細を確認し、入力値の妥当性を検証してください。');
    expect((thrownError as any).anomalousValueAlerts).toHaveLength(2);
    expect((thrownError as any).anomalousValueAlerts[0]).toMatchObject({
      systemId: 'SYS-001',
      anomalyType: 'unexpectedHighCost',
      affectedField: 'initialImplementationCost',
      expectedRange: { min: 800000, max: 1200000 },
      actualValue: 1500000,
      severity: 'high',
    });
    expect((thrownError as any).anomalousValueAlerts[1]).toMatchObject({
      systemId: 'SYS-001',
      anomalyType: 'deviationFromIndustryAverage',
      affectedField: 'threeYearTotalTCO',
      expectedRange: { min: 2400000, max: 2800000 },
      actualValue: 3150000,
      severity: 'high',
    });
    expect((thrownError as any).tcoEstimates).toHaveLength(2);
  });
});
