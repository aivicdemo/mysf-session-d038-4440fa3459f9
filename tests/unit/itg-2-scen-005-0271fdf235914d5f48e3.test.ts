import { runTx9Imp1Agent, type Tx9Imp1AiClient, type Tx9Imp1AgentInput } from '../../src/agents/tx-9-imp-1/orchestrator';
import * as authModule from '../../src/logic/authentication-authorization';
import * as contextModule from '../../src/logic/project-context-resolver';
import * as mappingModule from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/mapping-persistence');

const mockAuthModule = authModule as jest.Mocked<typeof authModule>;
const mockContextModule = contextModule as jest.Mocked<typeof contextModule>;
const mockMappingModule = mappingModule as jest.Mocked<typeof mappingModule>;

class MigrationProjectNotActiveException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MigrationProjectNotActiveException';
  }
}

describe('SCEN-005: 移行プロジェクトのステータスが進行中でない場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('MigrationProjectNotActiveExceptionが発生し、エラーメッセージが返される', async () => {
    const mockAiClient: Tx9Imp1AiClient = {
      extractData: jest.fn(),
      collectData: jest.fn(),
      calculateTco: jest.fn(),
      detectAnomalies: jest.fn(),
      generateSheet: jest.fn(),
    };

    mockAuthModule.verifyUserAuthenticationAndAuthorization.mockResolvedValue({
      isAuthenticated: true,
      userId: 'user-123',
      roles: ['migration_admin'],
      hasPermission: true,
    });

    mockContextModule.resolveProjectContext.mockResolvedValue({
      projectId: 'proj-001',
      projectName: 'Salesforce Migration Project',
      userHasAccess: true,
    });

    mockMappingModule.retrieveMappingDetailsForProject.mockResolvedValue({
      projectId: 'proj-001',
      status: 'closed',
      startDate: '2026-01-01T00:00:00Z',
      endDate: '2026-03-31T23:59:59Z',
      milestoneDates: [],
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
        requiredDataItems: ['invoice_id', 'invoice_date', 'amount'],
        departmentSources: [
          { departmentName: 'Finance', sourceSystemIds: ['oracle-erp-001'] },
        ],
        collectionDeadline: '2026-12-31T23:59:59Z',
      },
      tcoPeriodYears: 3,
      anomalyDetectionThresholds: {
        costVariancePercentage: 15,
        dataCompletenessMinimum: 95,
        outlierStandardDeviations: 3,
      },
      currentDateTime: '2026-06-15T10:30:00Z',
      executingUserId: 'user-123',
    };

    await expect(runTx9Imp1Agent(input, mockAiClient)).rejects.toThrow(MigrationProjectNotActiveException);
    await expect(runTx9Imp1Agent(input, mockAiClient)).rejects.toThrow(
      '移行プロジェクトが進行中ではありません。プロジェクトステータスを確認してください。'
    );

    expect(mockAuthModule.verifyUserAuthenticationAndAuthorization).toHaveBeenCalledWith('user-123');
    expect(mockContextModule.resolveProjectContext).toHaveBeenCalledWith('proj-001', 'user-123');
    expect(mockMappingModule.retrieveMappingDetailsForProject).toHaveBeenCalledWith('proj-001');
  });
});
