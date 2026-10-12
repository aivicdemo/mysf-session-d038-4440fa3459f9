import { runTx2Imp1Agent, Tx2Imp1AiClient } from '../../src/agents/tx-2-imp-1/orchestrator';

describe('SCEN-005: 監視対象期間が空文字列で指定された場合', () => {
  it('InvalidPeriodErrorが発生する', async () => {
    const mockAiClient: Tx2Imp1AiClient = {};

    const input = {
      executorUserId: 'user-001',
      targetPeriod: { startDate: '', endDate: '' },
      executionTimestamp: '2026-10-07T10:00:00Z',
    };

    await expect(runTx2Imp1Agent(input, mockAiClient)).rejects.toThrow(
      '監視対象期間が無効です。開始日は終了日以前である必要があります。'
    );
  });
});
