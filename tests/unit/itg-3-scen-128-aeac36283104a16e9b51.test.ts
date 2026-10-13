import { startScheduledMonitoringCycle } from '../../src/logic/scheduled-monitoring-orchestrator';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveMonitoringLogsAndCorrectionHistory: jest.fn(),
}));

describe('SCEN-128: エスカレーション通知内容の生成に失敗', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('failedステータスとエラー詳細を返す', async () => {
    const mockLogsData = {
      logs: [
        {
          cycleId: 'cycle-20250309',
          executedAt: new Date('2025-03-09T09:00:00Z'),
          discrepanciesDetected: 3,
        },
      ],
      correctionHistory: [
        {
          discrepancyId: 'disc-001',
          correctedAt: new Date('2025-03-09T14:30:00Z'),
          status: 'completed',
        },
      ],
    };

    (discrepancyPersistence.retrieveMonitoringLogsAndCorrectionHistory as jest.Mock).mockResolvedValue(mockLogsData);

    const result = await startScheduledMonitoringCycle({
      executionTimestamp: new Date('2025-03-10T09:00:00Z'),
      isBusinessDay: true,
      targetPeriodStart: new Date('2025-03-01T00:00:00Z'),
      targetPeriodEnd: new Date('2025-03-09T23:59:59Z'),
    });

    // When buildEscalationNotificationContent fails, the result should show failed status
    expect(result.executionStatus).toBe('failed');
    expect(result.errorDetails).toContain('エスカレーション通知内容の生成に失敗しました');
    expect(result.monitoringCycleId).toBeTruthy();
    expect(result.discrepanciesDetected).toBe(3);
    expect(result.escalationExecuted).toBe(false);
    expect(result.escalationDetails).toBeUndefined();
  });
});
