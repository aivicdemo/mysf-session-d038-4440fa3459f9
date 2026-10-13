import { runTx9Imp1Agent, type Tx9Imp1AiClient, type Tx9Imp1AgentInput } from '../../src/agents/tx-9-imp-1/orchestrator';
import * as authModule from '../../src/logic/authentication-authorization';

jest.mock('../../src/logic/authentication-authorization');

const mockAuthModule = authModule as jest.Mocked<typeof authModule>;

class UserNotAuthenticatedException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserNotAuthenticatedException';
  }
}

describe('SCEN-002: ユーザーが認証されていない場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('UserNotAuthenticatedExceptionが発生し、エラーメッセージが返される', async () => {
    const mockAiClient: Tx9Imp1AiClient = {
      extractData: jest.fn(),
      collectData: jest.fn(),
      calculateTco: jest.fn(),
      detectAnomalies: jest.fn(),
      generateSheet: jest.fn(),
    };

    mockAuthModule.verifyUserAuthenticationAndAuthorization.mockResolvedValue({
      authenticated: false,
      username: 'user-123',
      token: null,
      permissions: [],
    });

    const input: Tx9Imp1AgentInput = {
      projectId: 'proj-001',
      targetSystemCandidates: [
        {
          systemId: 'oracle-erp-001',
          systemName: 'Oracle ERP',
          systemDescription: '移行対象のOracle請求システム',
        },
      ],
      dataExtractionScope: {
        requiredDataItems: ['invoiceNumber', 'invoiceAmount', 'invoiceDate'],
        departmentSources: [
          { departmentName: '経理部門', sourceSystemIds: ['oracle-erp-001'] },
        ],
        collectionDeadline: '2026-10-15T00:00:00Z',
      },
      tcoPeriodYears: 3,
      anomalyDetectionThresholds: {
        costVariancePercentage: 15,
        dataCompletenessMinimum: 95,
        outlierStandardDeviations: 2.5,
      },
      currentDateTime: '2026-10-07T10:00:00Z',
      executingUserId: 'user-123',
    };

    await expect(runTx9Imp1Agent(input, mockAiClient)).rejects.toThrow(UserNotAuthenticatedException);
    await expect(runTx9Imp1Agent(input, mockAiClient)).rejects.toThrow(
      'ユーザー認証に失敗しました。ログインしてください。'
    );

    expect(mockAuthModule.verifyUserAuthenticationAndAuthorization).toHaveBeenCalledWith('user-123');
  });
});
