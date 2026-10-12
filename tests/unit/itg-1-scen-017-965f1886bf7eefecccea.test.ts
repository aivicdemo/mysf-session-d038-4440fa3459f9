import { runTx3Imp1Agent, Tx3Imp1AiClient, TargetSystemSpecificationInvalid } from '../../src/agents/tx-3-imp-1/orchestrator';
import type { Tx3Imp1AgentInput } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-017: 移行対象システムの仕様定義が不完全または形式が不正な場合', () => {
  let mockAiClient: Tx3Imp1AiClient;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAiClient = {
      method1: jest.fn(),
    };
  });

  it('should throw TargetSystemSpecificationInvalid when specification is incomplete', async () => {
    const input: Tx3Imp1AgentInput = {
      legacySystemAccessCredentials: {
        systemName: 'Salesforce',
        accessUrl: 'https://salesforce.example.com',
        apiKey: 'valid-api-key-12345',
      },
      targetSystemSpecification: {
        systemName: 'TargetERP',
        standardFeatures: null as any,
        dataModel: [],
        calculationCapabilities: [],
      },
      executionContext: {
        requestedBy: 'accounting-user-001',
        requestedAt: '2024-01-15T10:30:00Z',
        priority: 'high',
      },
    };

    await expect(runTx3Imp1Agent(input, mockAiClient)).rejects.toThrow(TargetSystemSpecificationInvalid);

    await expect(runTx3Imp1Agent(input, mockAiClient)).rejects.toThrow(
      /移行対象システムの仕様定義が不完全です。必須項目（標準機能一覧、API仕様、データモデル）を確認してください。/,
    );
  });
});
