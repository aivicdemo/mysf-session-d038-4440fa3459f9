import { runTx5Imp1Agent, Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';
import * as correctionMethodDetermination from '../../src/logic/correction-method-determination-engine';

jest.mock('../../src/logic/discrepancy-persistence');
jest.mock('../../src/logic/correction-method-determination-engine');

describe('SCEN-023: エスカレーション有効化フラグが false の場合', () => {
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
        discrepancyId: 'DIS-2026-001',
        discrepancyType: 'AMOUNT_MISMATCH',
        detectedAmount: 50000,
        toleranceAmount: 10000,
        sourceSystem: 'legacy_billing',
        targetSystem: 'sales_system',
        detectionTimestamp: '2026-01-15T08:30:00Z',
      },
      {
        discrepancyId: 'DIS-2026-002',
        discrepancyType: 'RECORD_COUNT_MISMATCH',
        detectedCount: 5,
        toleranceCount: 2,
        sourceSystem: 'legacy_billing',
        targetSystem: 'sales_system',
        detectionTimestamp: '2026-01-15T08:35:00Z',
      },
    ];

    const mockToleranceCriteria = [
      {
        discrepancyType: 'AMOUNT_MISMATCH',
        toleranceAmount: 10000,
        patternClassification: 'NORMAL',
      },
      {
        discrepancyType: 'RECORD_COUNT_MISMATCH',
        toleranceCount: 2,
        patternClassification: 'NORMAL',
      },
    ];

    const mockCorrectionMethods = [
      {
        discrepancyId: 'DIS-2026-001',
        correctionMethod: 'AUTO_SYNC',
        targetSystem: 'sales_system',
        priority: 'HIGH',
        autoExecutable: true,
      },
      {
        discrepancyId: 'DIS-2026-002',
        correctionMethod: 'AUTO_SYNC',
        targetSystem: 'sales_system',
        priority: 'MEDIUM',
        autoExecutable: true,
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
      trackingRecordId: 'TRACK-2026-001',
      saveSucceeded: true,
    });
  });

  it('通知は送付されるが追跡管理レコードの自動昇格は実施されない', async () => {
    const input = {
      executorUserId: 'user-sales-system-owner-001',
      discrepancyAnalysisContext: {
        analysisTimestamp: '2026-01-15T10:00:00Z',
        targetPeriodStart: '2026-01-01',
        targetPeriodEnd: '2026-01-15',
        includeExceptionPatterns: true,
      },
      notificationChannels: {
        accountingDepartmentEmail: 'accounting@company.jp',
        salesSystemOwnerEmail: 'sales-owner@company.jp',
        escalationEnabled: false,
      },
    };

    mockAiClient.executeAutoCorrection = jest.fn().mockResolvedValue({
      success: true,
      completedDiscrepancies: ['DIS-2026-001', 'DIS-2026-002'],
    });
    mockAiClient.generateNotification = jest.fn().mockResolvedValue({
      accounting: { sentAt: '2026-01-15T10:00:10Z', status: 'sent' },
      sales: { sentAt: '2026-01-15T10:00:12Z', status: 'sent' },
    });

    const result = await runTx5Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('completed');
    expect(result.analysisResult.totalDiscrepanciesAnalyzed).toBe(2);
    expect(result.analysisResult.normalPatternCount).toBe(2);
    expect(result.analysisResult.exceptionPatternCount).toBe(0);
    expect(result.analysisResult.autoCompletedCount).toBe(2);
    expect(result.analysisResult.requiresManualInterventionCount).toBe(0);
    expect(result.notificationsSent).toHaveLength(2);
    expect(result.notificationsSent[0].recipientEmail).toBe('accounting@company.jp');
    expect(result.notificationsSent[0].deliveryStatus).toBe('sent');
    expect(result.notificationsSent[1].recipientEmail).toBe('sales-owner@company.jp');
    expect(result.notificationsSent[1].deliveryStatus).toBe('sent');
    expect(result.autoCompletedDiscrepancies).toHaveLength(2);
    expect(result.autoCompletedDiscrepancies[0].discrepancyId).toBe('DIS-2026-001');
    expect(result.autoCompletedDiscrepancies[0].completionMethod).toBe('AUTO_SYNC');
    expect(result.autoCompletedDiscrepancies[0].verificationResult).toBe('success');
    expect(result.exceptionDiscrepancies).toEqual([]);
    expect(result.accountingReportContent.reportGeneratedAt).toBeDefined();
    expect(result.accountingReportContent.discrepancySummary).toBeDefined();
    expect(result.accountingReportContent.normalPatternSummary).toBeDefined();
    expect(result.executionLog.length).toBeGreaterThan(0);
  });
});
