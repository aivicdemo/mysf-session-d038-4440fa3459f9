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

class TcoCostCalculationException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TcoCostCalculationException';
  }
}

describe('SCEN-008: 3年間TCO試算シートへの自動入力・計算処理に失敗した場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('TcoCostCalculationExceptionが発生し、エラーメッセージが返される', async () => {
    const mockAiClient: Tx9Imp1AiClient = {
      extractData: jest.fn(),
      collectData: jest.fn(),
      calculateTco: jest.fn().mockRejectedValue(
        new Error('TCO試算計算に失敗しました。入力データの形式と値を確認してください。')
      ),
      detectAnomalies: jest.fn(),
      generateSheet: jest.fn(),
    };

    mockAuthModule.verifyUserAuthenticationAndAuthorization.mockResolvedValue({
      isAuthenticated: true,
      userRole: 'migration_operator',
    });

    mockContextModule.resolveProjectContext.mockResolvedValue({
      projectId: 'proj-2026-001',
      targetSystemIds: ['oracle-erp-001'],
      resolved: true,
    });

    mockMappingModule.retrieveMappingDetailsForProject.mockResolvedValue({
      projectId: 'proj-2026-001',
      projectStatus: 'active',
      targetSystemId: 'oracle-erp-001',
    });

    const input: Tx9Imp1AgentInput = {
      projectId: 'proj-2026-001',
      targetSystemCandidates: [
        {
          systemId: 'oracle-erp-001',
          systemName: 'Oracle ERP',
          systemDescription: '既存請求管理システム',
        },
      ],
      dataExtractionScope: {
        requiredDataItems: ['invoice_amount', 'tax_rate', 'discount_percentage'],
        departmentSources: [
          { departmentName: '財務部', sourceSystemIds: ['oracle-erp-001'] },
        ],
        collectionDeadline: '2026-10-31T23:59:59Z',
      },
      tcoPeriodYears: 3,
      anomalyDetectionThresholds: {
        costVariancePercentage: 15,
        dataCompletenessMinimum: 95,
        outlierStandardDeviations: 2,
      },
      currentDateTime: '2026-10-07T10:00:00Z',
      executingUserId: 'user-migration-001',
    };

    await expect(runTx9Imp1Agent(input, mockAiClient)).rejects.toThrow(TcoCostCalculationException);
    await expect(runTx9Imp1Agent(input, mockAiClient)).rejects.toThrow(
      'TCO試算計算に失敗しました。入力データの形式と値を確認してください。'
    );

    expect(mockAuthModule.verifyUserAuthenticationAndAuthorization).toHaveBeenCalledWith('user-migration-001');
    expect(mockContextModule.resolveProjectContext).toHaveBeenCalledWith('proj-2026-001', 'user-migration-001');
    expect(mockMappingModule.retrieveMappingDetailsForProject).toHaveBeenCalledWith('proj-2026-001');
  });
});
