import { monitorCorrectionSLACompliance, SLAMonitoringDataRetrievalFailure, type MonitorCorrectionSLAComplianceInput } from '../../src/logic/scheduled-monitoring-orchestrator';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
}));

describe('SCEN-158: 是正追跡管理レコード取得処理が失敗した場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('SLAMonitoringDataRetrievalFailure エラーで監視を中断する', async () => {
    const currentTimestamp = new Date('2024-02-05T10:30:00Z');

    (discrepancyPersistence.retrieveMonitoringLogsAndCorrectionHistory as jest.Mock)
      .mockRejectedValue(new Error('データ取得エラー'));

    const input: MonitorCorrectionSLAComplianceInput = {
      monitoringCycleId: 'CYCLE-2024-001',
      targetPeriodStart: new Date('2024-01-01T00:00:00Z'),
      targetPeriodEnd: new Date('2024-01-31T23:59:59Z'),
      currentTimestamp: currentTimestamp,
    };

    await expect(monitorCorrectionSLACompliance(input))
      .rejects
      .toThrow(SLAMonitoringDataRetrievalFailure);
  });
});
