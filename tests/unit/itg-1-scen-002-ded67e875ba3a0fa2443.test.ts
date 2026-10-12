import { runTx2Imp1Agent, Tx2Imp1AiClient } from '../../src/agents/tx-2-imp-1/orchestrator';

describe('SCEN-002: 実行ユーザーが営業データ・請求データへのアクセス権を持たない場合', () => {
  it('AccessDeniedErrorが発生する', async () => {
    class AccessDeniedError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'AccessDeniedError';
      }
    }

    const mockAiClient: Tx2Imp1AiClient = {
      enforceAccessControlForDataDisplay: jest.fn().mockRejectedValue(
        new AccessDeniedError('このユーザーは営業プロセス・請求データへのアクセス権がありません。')
      ),
    };

    const input = {
      executorUserId: 'user-001',
      targetPeriod: { startDate: '2024-01-01', endDate: '2024-01-31' },
      executionTimestamp: '2024-02-01T10:00:00Z',
    };

    await expect(runTx2Imp1Agent(input, mockAiClient)).rejects.toThrow(
      'このユーザーは営業プロセス・請求データへのアクセス権がありません。'
    );
  });
});
