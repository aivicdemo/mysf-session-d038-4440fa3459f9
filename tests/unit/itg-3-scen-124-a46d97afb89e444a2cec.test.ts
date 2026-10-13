import { startScheduledMonitoringCycle, MonitoringLogsRetrievalFailed, EscalationRecipientDeterminationFailed, NotificationContentGenerationFailed } from '../../src/logic/scheduled-monitoring-orchestrator';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveMonitoringLogsAndCorrectionHistory: jest.fn(),
}));

describe('SCEN-124: 営業日の09:00に監視サイクルを起動', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('差異の照合処理を実行して監視サイクルIDと完了ステータスを返す', async () => {
    const mockLogsData = {
      monitoringLogs: [
        {
          cycleId: 'CYCLE-20260114-001',
          executionDate: new Date('2026-01-14T09:00:00Z'),
          discrepanciesDetected: 3,
          status: 'completed',
        },
      ],
      correctionHistory: [
        {
          discrepancyId: 'DISC-20260114-001',
          detectedDate: new Date('2026-01-14T09:15:00Z'),
          correctionStatus: 'completed',
          correctionCompletedDate: new Date('2026-01-14T11:30:00Z'),
        },
      ],
    };

    (discrepancyPersistence.retrieveMonitoringLogsAndCorrectionHistory as jest.Mock).mockResolvedValue(mockLogsData);

    const result = await startScheduledMonitoringCycle({
      executionTimestamp: new Date('2026-01-15T09:00:00Z'),
      isBusinessDay: true,
      targetPeriodStart: new Date('2026-01-14T00:00:00Z'),
      targetPeriodEnd: new Date('2026-01-15T23:59:59Z'),
    });

    expect(result.executionStatus).toBe('completed');
    expect(result.monitoringCycleId).toMatch(/^cycle-/);
    expect(result.monitoringCycleId).toBeTruthy();
    expect(result.discrepanciesDetected).toBe(1);
    expect(result.escalationExecuted).toBe(true);
    expect(Array.isArray(result.escalationDetails)).toBe(true);
    expect(result.escalationDetails).toBeDefined();
    expect(result.escalationDetails!.length).toBe(2);

    // Verify escalationDetails contains expected recipient roles
    const recipientRoles = result.escalationDetails!.map(d => d.recipientRole);
    expect(recipientRoles).toContain('営業部システム担当');
    expect(recipientRoles).toContain('経理部門');

    // Verify each escalation detail has required properties
    result.escalationDetails!.forEach(detail => {
      expect(detail).toHaveProperty('recipientRole');
      expect(detail).toHaveProperty('discrepancyCount', 1);
      expect(detail).toHaveProperty('slaDeadline');
      expect(detail.slaDeadline).toEqual(new Date('2026-01-15T13:00:00Z'));
    });

    expect(result.errorDetails).toBeNull();
  });
});
