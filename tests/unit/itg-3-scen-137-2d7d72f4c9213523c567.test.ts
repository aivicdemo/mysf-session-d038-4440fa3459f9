import { startScheduledMonitoringCycle } from '../../src/logic/scheduled-monitoring-orchestrator';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn().mockResolvedValue([]),
}));

describe('SCEN-137: ステータス不整合のみで金額差異がないとき中と判定', () => {
  it('エスカレーション対象なしと8時間以内のSLAを返す', async () => {

    const input = {
      executionTimestamp: new Date('2025-01-15T09:00:00Z'),
      isBusinessDay: true,
      targetPeriodStart: new Date('2025-01-14T00:00:00Z'),
      targetPeriodEnd: new Date('2025-01-15T23:59:59Z'),
    };

    const result = await startScheduledMonitoringCycle(input);

    expect(result.executionStatus).toBe('completed');
    expect(result.discrepanciesDetected).toBe(1);
    expect(result.escalationExecuted).toBe(false);
    expect(result.escalationDetails).toEqual([]);
    expect(result.errorDetails).toBeNull();

    // SLA期限は実行時刻から8時間以内
    const expectedSlaDeadline = new Date('2025-01-15T17:00:00Z');
    if (result.escalationDetails && result.escalationDetails.length > 0) {
      expect(result.escalationDetails[0].slaDeadline).toEqual(expectedSlaDeadline);
    }
  });
});
