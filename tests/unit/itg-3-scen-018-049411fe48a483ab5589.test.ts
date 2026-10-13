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

describe('SCEN-018: NotificationGenerationFailedError - 通知内容の生成に失敗', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw NotificationGenerationFailedError when notification generation fails', async () => {
    const input = {
      executorUserId: 'user-001',
      discrepancyAnalysisContext: {
        analysisTimestamp: '2026-01-15T10:00:00Z',
        targetPeriodStart: '2026-01-01',
        targetPeriodEnd: '2026-01-15',
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
        discrepancyId: 'DISC-001',
        discrepancyType: 'amount_mismatch',
        detectedAmount: 50000,
        systemAAmount: 50000,
        systemBAmount: 45000,
        detectionTimestamp: '2026-01-15T09:30:00Z',
      },
      {
        discrepancyId: 'DISC-002',
        discrepancyType: 'status_mismatch',
        detectedStatus: 'completed',
        systemAStatus: 'completed',
        systemBStatus: 'pending',
        detectionTimestamp: '2026-01-15T09:35:00Z',
      },
    ];

    const toleranceCriteria = [
      {
        discrepancyType: 'amount_mismatch',
        toleranceAmount: 10000,
        toleranceCount: 5,
        toleranceStatus: 'acceptable',
      },
      {
        discrepancyType: 'status_mismatch',
        toleranceAmount: 0,
        toleranceCount: 0,
        toleranceStatus: 'unacceptable',
      },
    ];

    const correctionMethods = [
      {
        discrepancyId: 'DISC-001',
        correctionMethod: 'automatic_sync',
        targetSystem: 'sales_system',
        priority: 'high',
      },
      {
        discrepancyId: 'DISC-002',
        correctionMethod: 'manual_review',
        targetSystem: 'sales_system',
        priority: 'critical',
      },
    ];

    (discrepancyPersistence.retrieveDiscrepancyDetailsForConfirmation as jest.Mock).mockResolvedValue(
      discrepancyRecords
    );
    (discrepancyPersistence.retrieveToleranceCriteriaByType as jest.Mock).mockResolvedValue(toleranceCriteria);
    (correctionMethodEngine.determineCorrectionMethod as jest.Mock).mockResolvedValue(correctionMethods);

    await expect(runTx5Imp1Agent(input, mockAiClient)).rejects.toThrow('NotificationGenerationFailedError');
    await expect(runTx5Imp1Agent(input, mockAiClient)).rejects.toThrow('通知内容の生成に失敗しました。');
  });
});
