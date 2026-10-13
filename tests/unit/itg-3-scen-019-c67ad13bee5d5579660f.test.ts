import { runTx5Imp1Agent, Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';
import * as correctionMethodDetermination from '../../src/logic/correction-method-determination-engine';

jest.mock('../../src/logic/discrepancy-persistence');
jest.mock('../../src/logic/correction-method-determination-engine');

class AutoCorrectionExecutionFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AutoCorrectionExecutionFailedError';
  }
}

describe('SCEN-019: AutoCorrectionExecutionFailedError が発生する', () => {
  let mockAiClient: Tx5Imp1AiClient;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAiClient = {
      analyzeDiscrepancies: jest.fn(),
      classifyPattern: jest.fn(),
      generateNotification: jest.fn(),
      executeAutoCorrection: jest.fn(),
      trackCorrection: jest.fn(),
    };

    const mockDiscrepancyDetails = [
      {
        discrepancyId: 'disc-001',
        type: 'AMOUNT_MISMATCH',
        amount: 5000,
        sourceSystem: 'SalesforceReplacement',
        targetSystem: 'LegacySystem',
        detectedAt: '2026-01-15T09:00:00Z',
      },
      {
        discrepancyId: 'disc-002',
        type: 'AMOUNT_MISMATCH',
        amount: 3000,
        sourceSystem: 'SalesforceReplacement',
        targetSystem: 'LegacySystem',
        detectedAt: '2026-01-15T09:15:00Z',
      },
    ];

    const mockToleranceCriteria = [
      {
        discrepancyType: 'AMOUNT_MISMATCH',
        toleranceAmount: 10000,
        toleranceCount: 5,
        toleranceStatusVariation: 'WITHIN_TOLERANCE',
      },
    ];

    const mockCorrectionMethods = [
      {
        discrepancyId: 'disc-001',
        correctionMethod: 'AUTO_SYNC',
        targetSystem: 'LegacySystem',
        confidence: 0.95,
      },
      {
        discrepancyId: 'disc-002',
        correctionMethod: 'AUTO_SYNC',
        targetSystem: 'LegacySystem',
        confidence: 0.92,
      },
    ];

    (discrepancyPersistence.retrieveDiscrepancyDetailsForConfirmation as jest.Mock).mockResolvedValue(
      mockDiscrepancyDetails
    );
    (discrepancyPersistence.retrieveToleranceCriteriaByType as jest.Mock).mockResolvedValue(
      mockToleranceCriteria
    );
    (correctionMethodDetermination.determineCorrectionMethod as jest.Mock).mockResolvedValue(
      mockCorrectionMethods
    );
  });

  it('通常パターンの差異に対する自動完結処理が失敗した場合、AutoCorrectionExecutionFailedError が発生する', async () => {
    const input = {
      executorUserId: 'user-001',
      discrepancyAnalysisContext: {
        analysisTimestamp: '2026-01-15T10:30:00Z',
        targetPeriodStart: '2026-01-01',
        targetPeriodEnd: '2026-01-15',
        includeExceptionPatterns: false,
      },
      notificationChannels: {
        accountingDepartmentEmail: 'accounting@company.com',
        salesSystemOwnerEmail: 'sales-owner@company.com',
        escalationEnabled: true,
      },
    };

    mockAiClient.executeAutoCorrection = jest
      .fn()
      .mockRejectedValue(new AutoCorrectionExecutionFailedError('自動完結処理の実行に失敗しました。'));

    await expect(runTx5Imp1Agent(input, mockAiClient)).rejects.toThrow(
      '自動完結処理の実行に失敗しました。'
    );
  });
});
