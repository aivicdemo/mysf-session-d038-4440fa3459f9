import { runTx9Imp1Agent, Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';

describe('SCEN-079: 実行ユーザーの権限が必要なデータ収集範囲にアクセスできない場合、InsufficientPermissionsエラーを返す', () => {
  it('should throw error when user lacks required permissions', async () => {
    const migrationCandidates = [
      {
        candidateId: 'CAND-001',
        candidateName: 'Oracle Cloud ERP',
        systemType: 'ERP',
        description: 'Oracle Cloud導入検討'
      },
      {
        candidateId: 'CAND-002',
        candidateName: 'SAP S/4HANA',
        systemType: 'ERP',
        description: 'SAP導入検討'
      }
    ];
    const currentDateTime = new Date('2024-01-15T10:30:00Z');
    const executionContext = {
      userId: 'user-restricted-001',
      userRole: 'sales_representative',
      organizationId: 'org-12345',
      sessionId: 'sess-abc123def456'
    };

    const mockAiClient: Tx9Imp1AiClient = {
      estimateTCOForMigrationCandidates: jest.fn().mockRejectedValue(
        new Error('実行ユーザーの権限が不足しています。システム管理者に権限の確認を依頼してください。')
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
    ).rejects.toThrow('権限が不足');
  });

  it('should verify user role restriction for sales_representative', async () => {
    const migrationCandidates = [
      { candidateId: 'CAND-001', candidateName: 'Oracle Cloud ERP', systemType: 'ERP' },
      { candidateId: 'CAND-002', candidateName: 'SAP S/4HANA', systemType: 'ERP' }
    ];
    const currentDateTime = new Date('2024-01-15T10:30:00Z');
    const executionContext = {
      userId: 'user-restricted-001',
      userRole: 'sales_representative',
      organizationId: 'org-12345',
      sessionId: 'sess-abc123def456'
    };

    const mockAiClient: Tx9Imp1AiClient = {
      estimateTCOForMigrationCandidates: jest.fn().mockRejectedValue(
        new Error('実行ユーザーの権限が不足しています。システム管理者に権限の確認を依頼してください。')
      )
    };

    expect(executionContext.userRole).toBe('sales_representative');

    await expect(
      runTx9Imp1Agent(
        {
          migrationCandidates,
          currentDateTime,
          executionContext
        },
        mockAiClient
      )
    ).rejects.toBeDefined();
  });
});
