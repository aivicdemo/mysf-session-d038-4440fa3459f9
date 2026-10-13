import { runTx5Imp1Agent, Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';
import * as correctionMethodDetermination from '../../src/logic/correction-method-determination-engine';

jest.mock('../../src/logic/discrepancy-persistence');
jest.mock('../../src/logic/correction-method-determination-engine');

describe('SCEN-021: 分析対象に通常パターン差異のみが含まれる場合', () => {
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
        discrepancyId: 'diff-001',
        sourceSystem: 'sales-system',
        targetSystem: 'accounting-system',
        discrepancyType: 'amount_mismatch',
        amount: 5000,
        detectedAt: '2026-01-15T08:00:00Z',
        status: 'pending_analysis',
      },
      {
        discrepancyId: 'diff-002',
        sourceSystem: 'sales-system',
        targetSystem: 'accounting-system',
        discrepancyType: 'record_count_mismatch',
        amount: 2,
        detectedAt: '2026-01-15T08:15:00Z',
        status: 'pending_analysis',
      },
      {
        discrepancyId: 'diff-003',
        sourceSystem: 'sales-system',
        targetSystem: 'accounting-system',
        discrepancyType: 'amount_mismatch',
        amount: 3000,
        detectedAt: '2026-01-15T08:30:00Z',
        status: 'pending_analysis',
      },
    ];

    const mockToleranceCriteria = [
      {
        discrepancyType: 'amount_mismatch',
        toleranceAmount: 10000,
        tolerancePercentage: 5,
      },
      {
        discrepancyType: 'record_count_mismatch',
        toleranceCount: 5,
      },
    ];

    const mockCorrectionMethods = [
      {
        discrepancyId: 'diff-001',
        correctionMethod: 'automatic_sync',
        targetSystem: 'accounting-system',
        priority: 'normal',
        estimatedExecutionTime: 300,
      },
      {
        discrepancyId: 'diff-002',
        correctionMethod: 'automatic_sync',
        targetSystem: 'accounting-system',
        priority: 'normal',
        estimatedExecutionTime: 180,
      },
      {
        discrepancyId: 'diff-003',
        correctionMethod: 'automatic_sync',
        targetSystem: 'accounting-system',
        priority: 'normal',
        estimatedExecutionTime: 240,
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

  it('全件が自動完結されて人手介入は不要になる', async () => {
    const input = {
      executorUserId: 'user-sales-system-owner-001',
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

    mockAiClient.executeAutoCorrection = jest.fn().mockResolvedValue({
      success: true,
      completedDiscrepancies: ['diff-001', 'diff-002', 'diff-003'],
    });
    mockAiClient.generateNotification = jest.fn().mockResolvedValue({
      accounting: { sentAt: '2026-01-15T10:30:10Z', status: 'success' },
      sales: { sentAt: '2026-01-15T10:30:12Z', status: 'success' },
    });

    const result = await runTx5Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('completed');
    expect(result.analysisResult.totalDiscrepanciesAnalyzed).toBe(3);
    expect(result.analysisResult.normalPatternCount).toBe(3);
    expect(result.analysisResult.exceptionPatternCount).toBe(0);
    expect(result.analysisResult.autoCompletedCount).toBe(3);
    expect(result.analysisResult.requiresManualInterventionCount).toBe(0);
    expect(result.correctionInstructions).toEqual([]);
    expect(result.autoCompletedDiscrepancies).toHaveLength(3);
    expect(result.autoCompletedDiscrepancies[0].discrepancyId).toBe('diff-001');
    expect(result.autoCompletedDiscrepancies[0].completionMethod).toBe('automatic_sync');
    expect(result.autoCompletedDiscrepancies[0].verificationResult).toBe('success');
    expect(result.exceptionDiscrepancies).toEqual([]);
    expect(result.notificationsSent).toHaveLength(2);
    expect(result.accountingReportContent.discrepancySummary).toBeDefined();
    expect(result.accountingReportContent.normalPatternSummary).toBeDefined();
    expect(result.accountingReportContent.exceptionPatternSummary).toBe('なし');
    expect(result.executionLog.length).toBeGreaterThan(0);
  });
});
