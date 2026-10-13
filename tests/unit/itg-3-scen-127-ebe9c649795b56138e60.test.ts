import { startScheduledMonitoringCycle, EscalationRecipientDeterminationFailed } from '../../src/logic/scheduled-monitoring-orchestrator';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveMonitoringLogsAndCorrectionHistory: jest.fn(),
}));

describe('SCEN-127: エスカレーション対象者の決定に失敗', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('failedステータスとエラー詳細を返す', async () => {
    const mockLogsData = {
      logs: [
        {
          cycleId: 'cycle-20260114',
          executionTime: new Date('2026-01-14T09:00:00Z'),
          discrepanciesDetected: 3,
        },
      ],
      corrections: [],
    };

    (discrepancyPersistence.retrieveMonitoringLogsAndCorrectionHistory as jest.Mock).mockResolvedValue(mockLogsData);

    const result = await startScheduledMonitoringCycle({
      executionTimestamp: new Date('2026-01-15T09:00:00Z'),
      isBusinessDay: true,
      targetPeriodStart: new Date('2026-01-01T00:00:00Z'),
      targetPeriodEnd: new Date('2026-01-15T23:59:59Z'),
    });

    // When determineEscalationRecipients fails internally, the result should show failed status
    expect(result.executionStatus).toBe('failed');
    expect(result.errorDetails).toContain('エスカレーション対象者の決定に失敗しました');
    expect(result.monitoringCycleId).toBeTruthy();
    expect(result.escalationExecuted).toBe(false);
    expect(result.discrepanciesDetected).toBe(0);
  });
});
