import { runTx3Imp1Agent, Tx3Imp1AiClient, LegacySystemExtractionFailure } from '../../src/agents/tx-3-imp-1/orchestrator';
import type { Tx3Imp1AgentInput } from '../../src/agents/tx-3-imp-1/orchestrator';
import * as legacySystemMappingModule from '../../src/logic/legacy-system-mapping';

jest.mock('../../src/logic/legacy-system-mapping', () => ({
  ...jest.requireActual<typeof legacySystemMappingModule>('../../src/logic/legacy-system-mapping'),
  extractAndMapLegacySystemSpecification: jest.fn(),
}));

describe('SCEN-016: 既存システムへのアクセス認証に失敗した場合', () => {
  let mockAiClient: Tx3Imp1AiClient;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAiClient = {
      method1: jest.fn(),
    };

    const mockLegacySystemMapping = legacySystemMappingModule as jest.Mocked<typeof legacySystemMappingModule>;

    (mockLegacySystemMapping.extractAndMapLegacySystemSpecification as jest.Mock).mockRejectedValue(
      new LegacySystemExtractionFailure('既存システムへのアクセスが認証情報エラー（401 Unauthorized）で失敗しました。提供された apiKey が無効またはアクセスURLが不正です。'),
    );
  });

  it('should throw LegacySystemExtractionFailure when credentials are invalid', async () => {
    const input: Tx3Imp1AgentInput = {
      legacySystemAccessCredentials: {
        systemName: 'Salesforce',
        accessUrl: 'https://invalid-salesforce-instance.salesforce.com',
        apiKey: 'invalid_api_key_12345',
      },
      targetSystemSpecification: {
        systemName: 'Microsoft Dynamics 365',
        standardFeatures: [
          { featureName: 'Account Management', description: '取引先管理', apiEndpoint: '/api/accounts' },
          { featureName: 'Opportunity Management', description: '商談管理', apiEndpoint: '/api/opportunities' },
        ],
        dataModel: [
          { objectName: 'Account', fields: [{ fieldName: 'accountId', fieldType: 'string' }, { fieldName: 'accountName', fieldType: 'string' }] },
        ],
        calculationCapabilities: [
          { calculationType: 'SUM', supportedOperations: ['ADD', 'SUBTRACT'] },
        ],
      },
      executionContext: {
        requestedBy: 'user@example.com',
        requestedAt: '2026-10-15T10:30:00Z',
        priority: 'high',
      },
    };

    await expect(runTx3Imp1Agent(input, mockAiClient)).rejects.toThrow(LegacySystemExtractionFailure);

    await expect(runTx3Imp1Agent(input, mockAiClient)).rejects.toThrow(
      /既存システムの仕様抽出に失敗しました。対象システムへのアクセス権限を確認し、再度実行してください。/,
    );
  });
});
