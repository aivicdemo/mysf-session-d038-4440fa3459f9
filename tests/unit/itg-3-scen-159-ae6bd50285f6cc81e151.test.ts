import { monitorCorrectionSLACompliance, ToleranceCriteriaRetrievalFailure, type MonitorCorrectionSLAComplianceInput } from '../../src/logic/scheduled-monitoring-orchestrator';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
}));

describe('SCEN-159: 差異許容基準取得処理が失敗した場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ToleranceCriteriaRetrievalFailure エラーで監視を中断する', async () => {
    const currentTimestamp = new Date('2025-01-08T10:30:00Z');

    const correctionRecords = [
      {
        correctionId: 'corr-001',
        differenceId: 'diff-001',
        correctionType: 'data_reconciliation',
        targetCompletionDate: '2025-01-06T17:00:00Z',
        actualCompletionDate: null,
        severity: 'high',
      },
    ];

    (discrepancyPersistence.retrieveMonitoringLogsAndCorrectionHistory as jest.Mock).mockResolvedValue({
      correctionTrackingHistory: correctionRecords,
    });

    // 差異許容基準の取得が失敗
    (discrepancyPersistence.retrieveToleranceCriteriaByType as jest.Mock)
      .mockRejectedValue(new Error('SLA基準の取得に失敗しました。監視を中断します。'));

    const input: MonitorCorrectionSLAComplianceInput = {
      monitoringCycleId: 'cycle-20250107-001',
      targetPeriodStart: new Date('2025-01-01T00:00:00Z'),
      targetPeriodEnd: new Date('2025-01-07T23:59:59Z'),
      currentTimestamp: currentTimestamp,
    };

    await expect(monitorCorrectionSLACompliance(input))
      .rejects
      .toThrow(ToleranceCriteriaRetrievalFailure);
  });
});
