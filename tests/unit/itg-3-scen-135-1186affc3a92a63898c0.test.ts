import { startScheduledMonitoringCycle } from '../../src/logic/scheduled-monitoring-orchestrator';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn().mockResolvedValue([]),
}));

describe('SCEN-135: 金額差異が1万円以上10万円未満のとき高と判定', () => {
  it('営業部と経理部門をエスカレーション対象と4時間以内のSLAを返す', async () => {

    const input = {
      executionTimestamp: new Date('2026-01-15T09:00:00Z'),
      isBusinessDay: true,
      targetPeriodStart: new Date('2026-01-01T00:00:00Z'),
      targetPeriodEnd: new Date('2026-01-15T23:59:59Z'),
    };

    const result = await startScheduledMonitoringCycle(input);

    expect(result.monitoringCycleId).toBeTruthy();
    expect(result.executionStatus).toBe('completed');
    expect(result.discrepanciesDetected).toBe(1);
    expect(result.escalationExecuted).toBe(true);
    expect(result.escalationDetails).toBeDefined();
    expect(result.escalationDetails).toHaveLength(2);

    const roles = result.escalationDetails!.map(d => d.recipientRole);
    expect(roles).toContain('営業部システム担当');
    expect(roles).toContain('経理部門');

    result.escalationDetails!.forEach(detail => {
      expect(detail.discrepancyCount).toBe(1);
      expect(detail.slaDeadline).toEqual(new Date('2026-01-15T13:00:00Z'));
    });

    expect(result.errorDetails).toBeNull();
  });
});
