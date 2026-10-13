import { startScheduledMonitoringCycle } from '../../src/logic/scheduled-monitoring-orchestrator';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn().mockResolvedValue([]),
}));

describe('SCEN-132: 差異が検出されない場合', () => {
  it('完了ステータスと差異件数0を返す', async () => {

    const input = {
      executionTimestamp: new Date('2026-01-15T09:00:00Z'),
      isBusinessDay: true,
      targetPeriodStart: new Date('2026-01-14T00:00:00Z'),
      targetPeriodEnd: new Date('2026-01-15T23:59:59Z'),
    };

    const result = await startScheduledMonitoringCycle(input);

    expect(result.executionStatus).toBe('completed');
    expect(result.discrepanciesDetected).toBe(0);
    expect(result.escalationExecuted).toBe(false);
    expect(result.escalationDetails).toEqual([]);
    expect(result.errorDetails).toBeNull();
    expect(result.monitoringCycleId).toBeTruthy();
  });
});
