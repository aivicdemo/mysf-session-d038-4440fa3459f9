import { startScheduledMonitoringCycle } from '../../src/logic/scheduled-monitoring-orchestrator';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn().mockResolvedValue([
      {
        cycleId: 'cycle-001',
        executionDate: new Date('2025-06-18T09:00:00Z'),
        discrepancyCount: 3,
        status: 'resolved',
      },
    ]),
}));

describe('SCEN-134: 件数差異が5件以上のとき極度と判定', () => {
  it('IT部門を含むエスカレーション対象と2時間以内のSLAを返す', async () => {
    const input = {
      executionTimestamp: new Date('2025-06-20T09:00:00Z'),
      isBusinessDay: true,
      targetPeriodStart: new Date('2025-06-19T00:00:00Z'),
      targetPeriodEnd: new Date('2025-06-20T23:59:59Z'),
    };

    const result = await startScheduledMonitoringCycle(input);

    expect(result.monitoringCycleId).toBeTruthy();
    expect(result.executionStatus).toBe('completed');
    expect(result.discrepanciesDetected).toBe(5);
    expect(result.escalationExecuted).toBe(true);
    expect(result.escalationDetails).toBeDefined();
    expect(result.escalationDetails).toHaveLength(3);

    result.escalationDetails!.forEach(detail => {
      expect(['営業部システム担当', '経理部門', 'IT部門']).toContain(detail.recipientRole);
      expect(detail.discrepancyCount).toBe(5);
      expect(detail.slaDeadline).toEqual(new Date('2025-06-20T11:00:00Z'));
    });

    expect(result.errorDetails).toBeNull();
  });
});
