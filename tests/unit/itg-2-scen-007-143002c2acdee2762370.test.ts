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

class DataCollectionIncompleteException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataCollectionIncompleteException';
  }
}

describe('SCEN-007: 各部門のシステム・資料からの必要なデータ収集が不完全な場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('DataCollectionIncompleteExceptionが発生し、欠落項目を含むエラーメッセージが返される', async () => {
    const mockAiClient: Tx9Imp1AiClient = {
      extractData: jest.fn(),
      collectData: jest.fn().mockResolvedValue({
        totalItemsRequired: 7,
        totalItemsCollected: 5,
        collectedItems: [
          { itemName: 'item-001', sourceSystem: 'oracle-erp-01', collectionStatus: 'SUCCESS' },
          { itemName: 'item-002', sourceSystem: 'oracle-erp-01', collectionStatus: 'SUCCESS' },
          { itemName: 'item-003', sourceSystem: 'oracle-erp-01', collectionStatus: 'SUCCESS' },
          { itemName: 'item-004', sourceSystem: 'oracle-erp-01', collectionStatus: 'SUCCESS' },
          { itemName: 'item-005', sourceSystem: 'oracle-erp-01', collectionStatus: 'SUCCESS' },
        ],
        missingItems: ['item-006', 'item-007'],
        completenessPercentage: 71.43,
        collectionTimestamp: '2026-10-10T09:45:00Z',
      }),
      calculateTco: jest.fn(),
      detectAnomalies: jest.fn(),
      generateSheet: jest.fn(),
    };

    mockAuthModule.verifyUserAuthenticationAndAuthorization.mockResolvedValue({
      isAuthenticated: true,
      userId: 'user-migration-admin-001',
      roles: ['MigrationProjectManager', 'DataCollectionLead'],
      hasPermission: true,
    });

    mockContextModule.resolveProjectContext.mockResolvedValue({
      projectId: 'proj-migration-001',
      projectName: 'Salesforce to Oracle Migration',
      isResolved: true,
      userHasAccess: true,
    });

    mockMappingModule.retrieveMappingDetailsForProject.mockResolvedValue({
      projectId: 'proj-migration-001',
      projectStatus: 'ACTIVE',
      startDate: '2026-09-01T00:00:00Z',
      endDate: '2026-12-31T23:59:59Z',
      isActive: true,
    });

    const input: Tx9Imp1AgentInput = {
      projectId: 'proj-migration-001',
      targetSystemCandidates: [
        {
          systemId: 'oracle-erp-01',
          systemName: 'Oracle ERP Cloud',
          systemDescription: 'Current billing system with invoice and line items',
        },
      ],
      dataExtractionScope: {
        requiredDataItems: ['item-001', 'item-002', 'item-003', 'item-004', 'item-005', 'item-006', 'item-007'],
        departmentSources: [
          { departmentName: 'Finance', sourceSystemIds: ['oracle-erp-01'] },
          { departmentName: 'Sales', sourceSystemIds: ['oracle-erp-01'] },
        ],
        collectionDeadline: '2026-10-15T23:59:59Z',
      },
      tcoPeriodYears: 3,
      anomalyDetectionThresholds: {
        costVariancePercentage: 15,
        dataCompletenessMinimum: 95,
        outlierStandardDeviations: 3,
      },
      currentDateTime: '2026-10-10T10:00:00Z',
      executingUserId: 'user-migration-admin-001',
    };

    await expect(runTx9Imp1Agent(input, mockAiClient)).rejects.toThrow(DataCollectionIncompleteException);

    try {
      await runTx9Imp1Agent(input, mockAiClient);
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain('必要なデータが不完全です');
      expect(message).toContain('item-006');
      expect(message).toContain('item-007');
    }

    expect(mockAuthModule.verifyUserAuthenticationAndAuthorization).toHaveBeenCalledWith('user-migration-admin-001');
    expect(mockContextModule.resolveProjectContext).toHaveBeenCalledWith('proj-migration-001', 'user-migration-admin-001');
    expect(mockMappingModule.retrieveMappingDetailsForProject).toHaveBeenCalledWith('proj-migration-001');
  });
});
