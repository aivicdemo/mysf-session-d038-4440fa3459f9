import { runTx5Imp1Agent, Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';
import * as correctionMethodDetermination from '../../src/logic/correction-method-determination-engine';

jest.mock('../../src/logic/discrepancy-persistence');
jest.mock('../../src/logic/correction-method-determination-engine');

class CorrectionTrackingRecordFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CorrectionTrackingRecordFailedError';
  }
}

describe('SCEN-020: CorrectionTrackingRecordFailedError が発生する', () => {
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
        sourceSystem: 'legacy-sales',
        targetSystem: 'new-sales',
        discrepancyType: 'amount_mismatch',
        detectedAmount: 150000,
        expectedAmount: 145000,
        detectionTimestamp: '2026-01-15T09:00:00Z',
      },
      {
        discrepancyId: 'disc-002',
        sourceSystem: 'legacy-sales',
        targetSystem: 'new-sales',
        discrepancyType: 'record_count_variance',
        detectedCount: 35,
        expectedCount: 35,
        detectionTimestamp: '2026-01-15T09:05:00Z',
      },
    ];

    const mockToleranceCriteria = [
      {
        discrepancyType: 'amount_mismatch',
        toleranceAmount: 10000,
        tolerancePercentage: 5,
        toleranceStatus: 'within_acceptable_range',
      },
      {
        discrepancyType: 'record_count_variance',
        toleranceCount: 2,
        toleranceStatus: 'within_acceptable_range',
      },
    ];

    (discrepancyPersistence.retrieveDiscrepancyDetailsForConfirmation as jest.Mock).mockResolvedValue(
      mockDiscrepancyDetails
    );
    (discrepancyPersistence.retrieveToleranceCriteriaByType as jest.Mock).mockResolvedValue(
      mockToleranceCriteria
    );
    (correctionMethodDetermination.determineCorrectionMethod as jest.Mock).mockRejectedValue(
      new CorrectionTrackingRecordFailedError('是正追跡管理の記録に失敗しました。')
    );
  });

  it('是正追跡管理レコードの保存に失敗した場合、CorrectionTrackingRecordFailedError が発生する', async () => {
    const input = {
      executorUserId: 'user-sales-system-owner-001',
      discrepancyAnalysisContext: {
        analysisTimestamp: '2026-01-15T10:30:00Z',
        targetPeriodStart: '2026-01-01',
        targetPeriodEnd: '2026-01-15',
        includeExceptionPatterns: true,
      },
      notificationChannels: {
        accountingDepartmentEmail: 'accounting@company.jp',
        salesSystemOwnerEmail: 'sales-owner@company.jp',
        escalationEnabled: true,
      },
    };

    await expect(runTx5Imp1Agent(input, mockAiClient)).rejects.toThrow(
      CorrectionTrackingRecordFailedError
    );
    await expect(runTx5Imp1Agent(input, mockAiClient)).rejects.toThrow(
      '是正追跡管理の記録に失敗しました。'
    );
  });
});
