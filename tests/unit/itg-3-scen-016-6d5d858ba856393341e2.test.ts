import { runTx5Imp1Agent, Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveDiscrepancyDetailsForConfirmation: jest.fn(),
  retrieveToleranceCriteriaByType: jest.fn(),
}));

describe('SCEN-016: ToleranceCriteriaNotFoundError - 差異種類に対応する許容基準が定義されていない', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ToleranceCriteriaNotFoundError when tolerance criteria is not defined for a discrepancy type', async () => {
    const input = {
      executorUserId: 'user-001',
      discrepancyAnalysisContext: {
        analysisTimestamp: '2026-10-07T10:00:00Z',
        targetPeriodStart: '2026-10-01',
        targetPeriodEnd: '2026-10-07',
        includeExceptionPatterns: true,
      },
      notificationChannels: {
        accountingDepartmentEmail: 'accounting@company.com',
        salesSystemOwnerEmail: 'sales-owner@company.com',
        escalationEnabled: true,
      },
    };

    const mockAiClient: Tx5Imp1AiClient = {} as Tx5Imp1AiClient;

    const discrepancyRecords = [
      {
        discrepancyId: 'diff-001',
        type: 'AMOUNT_MISMATCH',
        detectedAmount: 150000,
        sourceSystem: '営業システムA',
        targetSystem: '会計システムB',
        detectionTimestamp: '2026-10-07T09:30:00Z',
      },
      {
        discrepancyId: 'diff-002',
        type: 'STATUS_INCONSISTENCY',
        detectedAmount: 0,
        sourceSystem: '営業システムA',
        targetSystem: '会計システムB',
        detectionTimestamp: '2026-10-07T09:35:00Z',
      },
    ];

    const toleranceCriteria = [
      {
        type: 'AMOUNT_MISMATCH',
        toleranceAmount: 100000,
        toleranceCount: 5,
        toleranceStatusPattern: null,
      },
    ];

    (discrepancyPersistence.retrieveDiscrepancyDetailsForConfirmation as jest.Mock).mockResolvedValue(
      discrepancyRecords
    );
    (discrepancyPersistence.retrieveToleranceCriteriaByType as jest.Mock).mockResolvedValue(toleranceCriteria);

    await expect(runTx5Imp1Agent(input, mockAiClient)).rejects.toThrow('ToleranceCriteriaNotFoundError');
    await expect(runTx5Imp1Agent(input, mockAiClient)).rejects.toThrow(
      '差異種類に対応する許容基準が定義されていません。'
    );
  });
});
