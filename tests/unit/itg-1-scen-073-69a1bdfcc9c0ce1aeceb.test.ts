import { runTx9Imp1Agent, InvalidCandidateStructure, type Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';

describe('SCEN-073: システム候補の必須フィールド（ID、名称、種別）が欠落している場合、InvalidCandidateStructureエラーを返す', () => {
  it('should throw InvalidCandidateStructure error when candidateName is null', async () => {
    const input: any = {
      migrationCandidates: [
        {
          candidateId: 'SYS-001',
          candidateName: 'Zoho CRM',
          systemType: 'CRM',
        },
        {
          candidateId: 'SYS-002',
          candidateName: null as any,
          systemType: 'ERP',
        },
      ],
      currentDateTime: new Date('2026-10-07T10:00:00Z'),
      executionContext: {
        userId: 'user-123',
        userRole: 'admin',
        organizationId: 'org-456',
        sessionId: 'session-789',
      },
    };

    await expect(runTx9Imp1Agent(input, {} as any)).rejects.toThrow(InvalidCandidateStructure);
  });
});
