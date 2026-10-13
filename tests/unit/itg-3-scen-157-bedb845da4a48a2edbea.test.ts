import { monitorCorrectionSLACompliance, NoSLAExceedanceDetected, type MonitorCorrectionSLAComplianceInput } from '../../src/logic/scheduled-monitoring-orchestrator';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
}));

describe('SCEN-157: 監視対象期間内にSLA超過した是正レコードが1件も存在しない場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('NoSLAExceedanceDetected エラーで監視を完了する', async () => {
    const currentTimestamp = new Date('2025-01-08T10:00:00Z');

    // 是正追跡レコード一覧が空
    (discrepancyPersistence.retrieveMonitoringLogsAndCorrectionHistory as jest.Mock).mockResolvedValue({
      correctionTrackingHistory: [],
    });

    (discrepancyPersistence.retrieveToleranceCriteriaByType as jest.Mock)
      .mockResolvedValue(null);

    const input: MonitorCorrectionSLAComplianceInput = {
      monitoringCycleId: 'cycle-20250107-001',
      targetPeriodStart: new Date('2025-01-01T00:00:00Z'),
      targetPeriodEnd: new Date('2025-01-07T23:59:59Z'),
      currentTimestamp: currentTimestamp,
    };

    await expect(monitorCorrectionSLACompliance(input))
      .rejects
      .toThrow(NoSLAExceedanceDetected);
  });
});
