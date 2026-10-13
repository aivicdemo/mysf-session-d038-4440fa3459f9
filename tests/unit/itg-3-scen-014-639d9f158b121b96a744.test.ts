import { runTx5Imp1Agent, Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('SCEN-014: UnauthorizedAgentExecutionError - 権限なしでエージェント実行', () => {
  it('should throw UnauthorizedAgentExecutionError when executor lacks required permissions', async () => {
    const input = {
      executorUserId: 'user-without-permissions-001',
      discrepancyAnalysisContext: {
        analysisTimestamp: '2026-01-15T10:00:00Z',
        targetPeriodStart: '2026-01-01',
        targetPeriodEnd: '2026-01-31',
        includeExceptionPatterns: true,
      },
      notificationChannels: {
        accountingDepartmentEmail: 'accounting@company.jp',
        salesSystemOwnerEmail: 'sales-owner@company.jp',
        escalationEnabled: true,
      },
    };

    const mockAiClient: Tx5Imp1AiClient = {} as Tx5Imp1AiClient;

    await expect(runTx5Imp1Agent(input, mockAiClient)).rejects.toThrow('UnauthorizedAgentExecutionError');
    await expect(runTx5Imp1Agent(input, mockAiClient)).rejects.toThrow(
      'エージェント実行権限がありません。営業システム担当者またはIT部門の権限が必要です。'
    );
  });
});
