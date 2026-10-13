import { runTx9Imp1Agent, type Tx9Imp1AiClient, type Tx9Imp1AgentInput } from '../../src/agents/tx-9-imp-1/orchestrator';
import * as authModule from '../../src/logic/authentication-authorization';
import * as contextModule from '../../src/logic/project-context-resolver';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');

const mockAuthModule = authModule as jest.Mocked<typeof authModule>;
const mockContextModule = contextModule as jest.Mocked<typeof contextModule>;

class ProjectContextNotResolvedException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProjectContextNotResolvedException';
  }
}

describe('SCEN-004: プロジェクトコンテキストが解決できない場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ProjectContextNotResolvedExceptionが発生し、エラーメッセージが返される', async () => {
    const mockAiClient: Tx9Imp1AiClient = {
      extractData: jest.fn(),
      collectData: jest.fn(),
      calculateTco: jest.fn(),
      detectAnomalies: jest.fn(),
      generateSheet: jest.fn(),
    };

    mockAuthModule.verifyUserAuthenticationAndAuthorization.mockResolvedValue({
      isAuthenticated: true,
      hasPermission: true,
    });

    mockContextModule.resolveProjectContext.mockResolvedValue(null);

    const input: Tx9Imp1AgentInput = {
      projectId: 'proj-20250115-001',
      targetSystemCandidates: [
        {
          systemId: 'oracle-erp-001',
          systemName: 'Oracle ERP Cloud',
          systemDescription: '移行対象Oracle請求システム',
        },
      ],
      dataExtractionScope: {
        requiredDataItems: ['invoice_number', 'invoice_date', 'total_amount'],
        departmentSources: [
          { departmentName: 'Finance', sourceSystemIds: ['oracle-erp-001'] },
        ],
        collectionDeadline: '2025-01-20T23:59:59Z',
      },
      tcoPeriodYears: 3,
      anomalyDetectionThresholds: {
        costVariancePercentage: 15,
        dataCompletenessMinimum: 95,
        outlierStandardDeviations: 2.5,
      },
      currentDateTime: '2025-01-15T10:30:00Z',
      executingUserId: 'user-12345',
    };

    await expect(runTx9Imp1Agent(input, mockAiClient)).rejects.toThrow(ProjectContextNotResolvedException);
    await expect(runTx9Imp1Agent(input, mockAiClient)).rejects.toThrow(
      'プロジェクトコンテキストを解決できません。プロジェクトIDと移行対象システムIDを確認してください。'
    );

    expect(mockAuthModule.verifyUserAuthenticationAndAuthorization).toHaveBeenCalledWith('user-12345');
    expect(mockContextModule.resolveProjectContext).toHaveBeenCalledWith('proj-20250115-001', 'user-12345');
  });
});
