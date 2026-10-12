import { runTx2Imp1Agent, Tx2Imp1AiClient } from '../../src/agents/tx-2-imp-1/orchestrator';

describe('SCEN-003: 監視対象期間の開始日が終了日より後である場合', () => {
  it('InvalidPeriodErrorが発生する', async () => {
    const mockAiClient: Tx2Imp1AiClient = {};

    const input = {
      executorUserId: 'user-001',
      targetPeriod: { startDate: '2024-12-31', endDate: '2024-12-25' },
      executionTimestamp: '2024-12-31T10:00:00Z',
    };

    await expect(runTx2Imp1Agent(input, mockAiClient)).rejects.toThrow(
      '監視対象期間が無効です。開始日は終了日以前である必要があります。'
    );
  });
});
