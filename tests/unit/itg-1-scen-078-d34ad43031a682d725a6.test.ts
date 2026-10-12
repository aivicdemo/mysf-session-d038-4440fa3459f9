import { runTx9Imp1Agent, Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';

describe('SCEN-078: データ収集がタイムアウト（30秒以上応答なし）した場合、DataCollectionTimeoutエラーを返す', () => {
  it('should throw error when estimation times out', async () => {
    const migrationCandidates = [
      { candidateId: 'CAND-001', candidateName: 'Microsoft Dynamics 365', systemType: 'CRM' },
      { candidateId: 'CAND-002', candidateName: 'Zoho CRM', systemType: 'CRM' }
    ];
    const currentDateTime = new Date('2026-10-07T06:22:11.338Z');
    const executionContext = {
      userId: 'USER-123',
      userRole: 'finance_manager',
      organizationId: 'ORG-001',
      sessionId: 'SESSION-ABC123'
    };

    const mockAiClient: Tx9Imp1AiClient = {
      estimateTCOForMigrationCandidates: jest.fn().mockRejectedValue(
        new Error('Timeout: No response for 30 seconds')
      )
    };

    await expect(
      runTx9Imp1Agent(
        {
          migrationCandidates,
          currentDateTime,
          executionContext
        },
        mockAiClient
      )
    ).rejects.toThrow();
  });

  it('should return error with timeout message', async () => {
    const migrationCandidates = [
      { candidateId: 'CAND-001', candidateName: 'Microsoft Dynamics 365', systemType: 'CRM' },
      { candidateId: 'CAND-002', candidateName: 'Zoho CRM', systemType: 'CRM' }
    ];
    const currentDateTime = new Date('2026-10-07T06:22:11.338Z');
    const executionContext = {
      userId: 'USER-123',
      userRole: 'finance_manager',
      organizationId: 'ORG-001',
      sessionId: 'SESSION-ABC123'
    };

    const mockAiClient: Tx9Imp1AiClient = {
      estimateTCOForMigrationCandidates: jest.fn().mockImplementation(
        () => new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('データ収集がタイムアウトしました。ネットワーク接続と各部門システムの稼働状況を確認してください。'));
          }, 100);
        })
      )
    };

    await expect(
      runTx9Imp1Agent(
        {
          migrationCandidates,
          currentDateTime,
          executionContext
        },
        mockAiClient
      )
    ).rejects.toThrow('タイムアウト');
  });
});
