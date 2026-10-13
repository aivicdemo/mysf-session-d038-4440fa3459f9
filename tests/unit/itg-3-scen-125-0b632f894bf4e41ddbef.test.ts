import { startScheduledMonitoringCycle } from '../../src/logic/scheduled-monitoring-orchestrator';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveMonitoringLogsAndCorrectionHistory: jest.fn(),
}));

describe('SCEN-125: 営業日でない日付で監視サイクルを起動', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('スキップステータスを返す', async () => {
    (discrepancyPersistence.retrieveMonitoringLogsAndCorrectionHistory as jest.Mock).mockResolvedValue({
      logs: [],
      correctionHistory: [],
    });

    const result = await startScheduledMonitoringCycle({
      executionTimestamp: new Date('2025-01-15T09:00:00Z'),
      isBusinessDay: false,
      targetPeriodStart: new Date('2025-01-13T00:00:00Z'),
      targetPeriodEnd: new Date('2025-01-15T23:59:59Z'),
    });

    expect(result.executionStatus).toBe('skipped');
    expect(result.monitoringCycleId).toBe('');
    expect(result.discrepanciesDetected).toBe(0);
    expect(result.escalationExecuted).toBe(false);
    expect(result.escalationDetails).toBeUndefined();
    expect(result.errorDetails).toBeNull();
  });
});
