import { startScheduledMonitoringCycle } from '../../src/logic/scheduled-monitoring-orchestrator';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn().mockResolvedValue([
      {
        cycleId: 'CYCLE-2025-01-14',
        executionDate: new Date('2025-01-14T09:00:00Z'),
        discrepanciesDetected: 1,
      },
    ]),
}));

describe('SCEN-138: 月次締め日まで3営業日以内で中レベルの差異のとき重大度を高に上げる', () => {
  it('エスカレーション対象と4時間以内のSLAを返す', async () => {
    const input = {
      executionTimestamp: new Date('2025-01-15T09:00:00Z'),
      isBusinessDay: true,
      targetPeriodStart: new Date('2025-01-01T00:00:00Z'),
      targetPeriodEnd: new Date('2025-01-15T23:59:59Z'),
    };

    const result = await startScheduledMonitoringCycle(input);

    expect(result.executionStatus).toBe('completed');
    expect(result.monitoringCycleId).toBeTruthy();
    expect(result.discrepanciesDetected).toBeTruthy();
    expect(result.escalationExecuted).toBe(true);
    expect(result.escalationDetails).toBeDefined();

    const roles = result.escalationDetails!.map(d => d.recipientRole);
    expect(roles).toContain('営業部システム担当');
    expect(roles).toContain('経理部門');

    result.escalationDetails!.forEach(detail => {
      expect(detail.slaDeadline).toEqual(new Date('2025-01-15T13:00:00Z'));
    });
  });
});
