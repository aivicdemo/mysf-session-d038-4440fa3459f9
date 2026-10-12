import { runTx9Imp1Agent, MigrationCandidatesEmpty, type Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';

describe('SCEN-072: 評価対象システム候補が空配列の場合、MigrationCandidatesEmptyエラーを返す', () => {
  it('should throw MigrationCandidatesEmpty error when migrationCandidates is empty', async () => {
    const input: any = {
      migrationCandidates: [],
      currentDateTime: new Date('2026-10-07T10:30:00.000Z'),
      executionContext: {
        userId: 'user-001',
        userRole: 'system_admin',
        organizationId: 'org-001',
        sessionId: 'session-abc123',
      },
    };

    await expect(runTx9Imp1Agent(input, {} as any)).rejects.toThrow(MigrationCandidatesEmpty);
  });
});
