import { startScheduledMonitoringCycle, MonitoringLogsRetrievalFailed } from '../../src/logic/scheduled-monitoring-orchestrator';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveMonitoringLogsAndCorrectionHistory: jest.fn(),
}));

describe('SCEN-126: 監視ログの取得に失敗', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('failedステータスとエラー詳細を返す', async () => {
    (discrepancyPersistence.retrieveMonitoringLogsAndCorrectionHistory as jest.Mock).mockRejectedValue(
      new MonitoringLogsRetrievalFailed('監視ログの取得に失敗しました。監視サイクルを中断します。')
    );

    const result = await startScheduledMonitoringCycle({
      executionTimestamp: new Date('2025-06-15T09:00:00Z'),
      isBusinessDay: true,
      targetPeriodStart: new Date('2025-06-01T00:00:00Z'),
      targetPeriodEnd: new Date('2025-06-14T23:59:59Z'),
    });

    expect(result.executionStatus).toBe('failed');
    expect(result.errorDetails).toBe('監視ログの取得に失敗しました。監視サイクルを中断します。');
    expect(result.monitoringCycleId).toBeTruthy();
    expect(result.discrepanciesDetected).toBe(0);
    expect(result.escalationExecuted).toBe(false);
  });
});
