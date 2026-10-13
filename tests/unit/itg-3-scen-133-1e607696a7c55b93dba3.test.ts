import { startScheduledMonitoringCycle } from '../../src/logic/scheduled-monitoring-orchestrator';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn().mockResolvedValue([
      {
        cycleId: 'cycle-001',
        executionTime: new Date('2025-01-14T09:00:00Z'),
        discrepancyCount: 2,
        status: 'completed',
      },
    ]),
}));

describe('SCEN-133: 金額差異が10万円以上のとき極度と判定', () => {
  it('IT部門を含むエスカレーション対象と2時間以内のSLAを返す', async () => {
    const input = {
      executionTimestamp: new Date('2025-01-15T09:00:00Z'),
      isBusinessDay: true,
      targetPeriodStart: new Date('2025-01-14T00:00:00Z'),
      targetPeriodEnd: new Date('2025-01-15T23:59:59Z'),
    };

    const result = await startScheduledMonitoringCycle(input);

    expect(result.executionStatus).toBe('completed');
    expect(result.escalationExecuted).toBe(true);
    expect(result.escalationDetails).toBeDefined();
    expect(result.escalationDetails).toHaveLength(3);

    const roles = result.escalationDetails!.map(d => d.recipientRole);
    expect(roles).toContain('営業部システム担当');
    expect(roles).toContain('経理部門');
    expect(roles).toContain('IT部門');

    result.escalationDetails!.forEach(detail => {
      expect(detail.slaDeadline).toEqual(new Date('2025-01-15T11:00:00Z'));
    });

    expect(result.errorDetails).toBeNull();
    expect(result.monitoringCycleId).toBeTruthy();
  });
});
