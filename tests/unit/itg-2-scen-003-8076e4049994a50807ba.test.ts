import { runTx9Imp1Agent, type Tx9Imp1AiClient, type Tx9Imp1AgentInput } from '../../src/agents/tx-9-imp-1/orchestrator';
import * as authModule from '../../src/logic/authentication-authorization';

jest.mock('../../src/logic/authentication-authorization');

const mockAuthModule = authModule as jest.Mocked<typeof authModule>;

class InsufficientPermissionException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InsufficientPermissionException';
  }
}

describe('SCEN-003: ユーザーのロール権限が機能マッピング操作に不足している場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('InsufficientPermissionExceptionが発生し、エラーメッセージが返される', async () => {
    const mockAiClient: Tx9Imp1AiClient = {
      extractData: jest.fn(),
      collectData: jest.fn(),
      calculateTco: jest.fn(),
      detectAnomalies: jest.fn(),
      generateSheet: jest.fn(),
    };

    mockAuthModule.verifyUserAuthenticationAndAuthorization.mockResolvedValue({
      userId: 'user-002',
      isAuthenticated: false,
      hasPermissionForMappingOperation: false,
      authenticatedAt: '2024-06-15T09:00:00Z',
    });

    const input: Tx9Imp1AgentInput = {
      projectId: 'proj-migration-2024-01',
      targetSystemCandidates: [
        {
          systemId: 'oracle-erp-01',
          systemName: 'Oracle ERP',
          systemDescription: '移行対象のOracle請求・請求明細システム',
        },
      ],
      dataExtractionScope: {
        requiredDataItems: ['invoice_id', 'invoice_date', 'invoice_amount', 'line_item_description'],
        departmentSources: [
          { departmentName: 'accounting', sourceSystemIds: ['oracle-erp-01'] },
        ],
        collectionDeadline: '2024-12-31T23:59:59Z',
      },
      tcoPeriodYears: 3,
      anomalyDetectionThresholds: {
        costVariancePercentage: 15,
        dataCompletenessMinimum: 95,
        outlierStandardDeviations: 3,
      },
      currentDateTime: '2024-06-15T10:30:00Z',
      executingUserId: 'user-002',
    };

    await expect(runTx9Imp1Agent(input, mockAiClient)).rejects.toThrow(InsufficientPermissionException);
    await expect(runTx9Imp1Agent(input, mockAiClient)).rejects.toThrow(
      'この操作を実行する権限がありません。'
    );

    expect(mockAuthModule.verifyUserAuthenticationAndAuthorization).toHaveBeenCalledWith('user-002');
  });
});
