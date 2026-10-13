import {
  runTx5Imp1Agent,
  Tx5Imp1AiClient,
} from '../../src/agents/tx-5-imp-1/orchestrator';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';
import * as correctionMethodEngine from '../../src/logic/correction-method-determination-engine';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveDiscrepancyDetailsForConfirmation: jest.fn(),
  retrieveToleranceCriteriaByType: jest.fn(),
}));

jest.mock('../../src/logic/correction-method-determination-engine', () => ({
  ...jest.requireActual<typeof import('../../src/logic/correction-method-determination-engine')>('../../src/logic/correction-method-determination-engine'),
  determineCorrectionMethod: jest.fn(),
}));

describe('SCEN-017: CorrectionMethodDeterminationFailedError - 是正方法の判定処理が失敗', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw CorrectionMethodDeterminationFailedError when correction method determination fails', async () => {
    const input = {
      executorUserId: 'user-001',
      discrepancyAnalysisContext: {
        analysisTimestamp: '2026-01-15T10:00:00Z',
        targetPeriodStart: '2026-01-01',
        targetPeriodEnd: '2026-01-15',
        includeExceptionPatterns: true,
      },
      notificationChannels: {
        accountingDepartmentEmail: 'accounting@example.com',
        salesSystemOwnerEmail: 'sales-owner@example.com',
        escalationEnabled: true,
      },
    };

    const mockAiClient: Tx5Imp1AiClient = {} as Tx5Imp1AiClient;

    const discrepancyRecords = [
      {
        discrepancyId: 'diff-001',
        discrepancyType: 'amount',
        detectedAmount: 5000,
        status: 'detected',
      },
      {
        discrepancyId: 'diff-002',
        discrepancyType: 'count',
        detectedAmount: 3,
        status: 'detected',
      },
    ];

    const toleranceCriteria = [
      {
        discrepancyType: 'amount',
        toleranceAmount: 10000,
        toleranceStatus: 'acceptable',
      },
      {
        discrepancyType: 'count',
        toleranceCount: 5,
        toleranceStatus: 'acceptable',
      },
    ];

    (discrepancyPersistence.retrieveDiscrepancyDetailsForConfirmation as jest.Mock).mockResolvedValue(
      discrepancyRecords
    );
    (discrepancyPersistence.retrieveToleranceCriteriaByType as jest.Mock).mockResolvedValue(toleranceCriteria);
    (correctionMethodEngine.determineCorrectionMethod as jest.Mock).mockRejectedValue(
      new Error('是正方法の判定に失敗しました。')
    );

    await expect(runTx5Imp1Agent(input, mockAiClient)).rejects.toThrow('CorrectionMethodDeterminationFailedError');
    await expect(runTx5Imp1Agent(input, mockAiClient)).rejects.toThrow('是正方法の判定に失敗しました。');
  });
});
