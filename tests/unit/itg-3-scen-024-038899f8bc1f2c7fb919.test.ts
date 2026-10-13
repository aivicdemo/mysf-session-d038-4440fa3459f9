import { runTx5Imp1Agent, Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';
import * as correctionMethodDetermination from '../../src/logic/correction-method-determination-engine';

jest.mock('../../src/logic/discrepancy-persistence');
jest.mock('../../src/logic/correction-method-determination-engine');

describe('SCEN-024: executionStatus が partial_completed で返される場合', () => {
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
        discrepancyType: 'amount_mismatch',
        sourceSystem: 'legacy_system',
        targetSystem: 'new_system',
        detectedAt: '2026-10-07T08:00:00Z',
        differenceAmount: 50000,
      },
      {
        discrepancyId: 'disc-002',
        discrepancyType: 'record_count_mismatch',
        sourceSystem: 'legacy_system',
        targetSystem: 'new_system',
        detectedAt: '2026-10-07T08:15:00Z',
        differenceCount: 3,
      },
      {
        discrepancyId: 'disc-003',
        discrepancyType: 'status_inconsistency',
        sourceSystem: 'legacy_system',
        targetSystem: 'new_system',
        detectedAt: '2026-10-07T08:30:00Z',
        statusA: 'completed',
        statusB: 'pending',
      },
    ];

    const mockToleranceCriteria = [
      {
        discrepancyType: 'amount_mismatch',
        toleranceAmount: 100000,
        tolerancePercentage: 5,
        toleranceStatus: 'acceptable',
      },
      {
        discrepancyType: 'record_count_mismatch',
        toleranceCount: 5,
        toleranceStatus: 'acceptable',
      },
      {
        discrepancyType: 'status_inconsistency',
        toleranceStatus: 'requires_manual_review',
      },
    ];

    const mockCorrectionMethods = [
      {
        discrepancyId: 'disc-001',
        correctionMethod: 'automatic_synchronization',
        status: 'success',
        targetSystem: 'new_system',
      },
      {
        discrepancyId: 'disc-002',
        correctionMethod: 'automatic_synchronization',
        status: 'failed',
        failureReason: 'Source system API timeout',
        targetSystem: 'new_system',
      },
      {
        discrepancyId: 'disc-003',
        correctionMethod: 'manual_review_required',
        status: 'pending',
        targetSystem: 'new_system',
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
    (discrepancyPersistence.saveCorrectionTrackingRecord as jest.Mock).mockResolvedValue({
      success: true,
    });
  });

  it('一部の差異分析に失敗したことを示す', async () => {
    const input = {
      executorUserId: 'user-sales-system-owner-001',
      discrepancyAnalysisContext: {
        analysisTimestamp: '2026-10-07T10:30:00Z',
        targetPeriodStart: '2026-10-01',
        targetPeriodEnd: '2026-10-07',
        includeExceptionPatterns: true,
      },
      notificationChannels: {
        accountingDepartmentEmail: 'accounting@company.jp',
        salesSystemOwnerEmail: 'sales-owner@company.jp',
        escalationEnabled: true,
      },
    };

    mockAiClient.executeAutoCorrection = jest.fn().mockResolvedValue({
      success: false,
      completedDiscrepancies: ['disc-001'],
      failedDiscrepancies: ['disc-002'],
    });
    mockAiClient.generateNotification = jest.fn().mockResolvedValue({
      accounting: { sentAt: '2026-10-07T10:30:10Z', status: 'partial_failure' },
      sales: { sentAt: '2026-10-07T10:30:12Z', status: 'partial_failure' },
    });

    const result = await runTx5Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('partial_completed');
    expect(result.analysisResult.totalDiscrepanciesAnalyzed).toBe(3);
    expect(result.analysisResult.normalPatternCount).toBe(1);
    expect(result.analysisResult.exceptionPatternCount).toBe(2);
    expect(result.analysisResult.autoCompletedCount).toBe(1);
    expect(result.analysisResult.requiresManualInterventionCount).toBe(2);
    expect(result.correctionInstructions).toHaveLength(2);
    expect(result.correctionInstructions[0].discrepancyId).toBe('disc-002');
    expect(result.correctionInstructions[0].correctionMethod).toBe('automatic_synchronization');
    expect(result.correctionInstructions[0].priority).toBe('high');
    expect(result.correctionInstructions[1].discrepancyId).toBe('disc-003');
    expect(result.correctionInstructions[1].correctionMethod).toBe('manual_review_required');
    expect(result.correctionInstructions[1].priority).toBe('medium');
    expect(result.accountingReportContent.discrepancySummary).toMatch(/1.*2/);
    expect(result.autoCompletedDiscrepancies).toHaveLength(1);
    expect(result.autoCompletedDiscrepancies[0].discrepancyId).toBe('disc-001');
    expect(result.autoCompletedDiscrepancies[0].completionMethod).toBe('automatic_synchronization');
    expect(result.autoCompletedDiscrepancies[0].verificationResult).toBe('success');
    expect(result.exceptionDiscrepancies).toHaveLength(2);
    expect(result.exceptionDiscrepancies[0].discrepancyId).toBe('disc-002');
    expect(result.exceptionDiscrepancies[0].exceptionReason).toBe('automatic_synchronization_failed');
    expect(result.exceptionDiscrepancies[0].requiredManualAction).toBe('retry_with_manual_intervention');
    expect(result.exceptionDiscrepancies[1].discrepancyId).toBe('disc-003');
    expect(result.exceptionDiscrepancies[1].exceptionReason).toBe('status_inconsistency_requires_review');
    expect(result.exceptionDiscrepancies[1].requiredManualAction).toBe('manual_status_reconciliation');
    expect(result.notificationsSent).toBeDefined();
    const partialFailureLog = result.executionLog.find(
      (log) => log.status === 'partial_failure'
    );
    expect(partialFailureLog).toBeDefined();
  });
});
