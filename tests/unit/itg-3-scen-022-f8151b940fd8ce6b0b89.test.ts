import { runTx5Imp1Agent, Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';
import * as correctionMethodDetermination from '../../src/logic/correction-method-determination-engine';

jest.mock('../../src/logic/discrepancy-persistence');
jest.mock('../../src/logic/correction-method-determination-engine');

describe('SCEN-022: 分析対象に例外パターン差異のみが含まれる場合', () => {
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
        discrepancyId: 'DISC-EXC-001',
        discrepancyType: 'INVOICE_AMOUNT_MISMATCH',
        sourceSystem: 'SALES_SYSTEM',
        targetSystem: 'ACCOUNTING_SYSTEM',
        detectedAmount: 150000,
        expectedAmount: 100000,
        differenceAmount: 50000,
        detectionTimestamp: '2026-01-15T09:00:00Z',
        status: 'DETECTED',
      },
      {
        discrepancyId: 'DISC-EXC-002',
        discrepancyType: 'CUSTOMER_MASTER_MISMATCH',
        sourceSystem: 'SALES_SYSTEM',
        targetSystem: 'ACCOUNTING_SYSTEM',
        detectedValue: 'Customer A Corp',
        expectedValue: 'Customer A',
        detectionTimestamp: '2026-01-15T09:15:00Z',
        status: 'DETECTED',
      },
      {
        discrepancyId: 'DISC-EXC-003',
        discrepancyType: 'PAYMENT_SCHEDULE_MISMATCH',
        sourceSystem: 'SALES_SYSTEM',
        targetSystem: 'ACCOUNTING_SYSTEM',
        detectedSchedule: ['2026-02-01', '2026-03-01'],
        expectedSchedule: ['2026-02-01', '2026-03-01', '2026-04-01'],
        detectionTimestamp: '2026-01-15T09:30:00Z',
        status: 'DETECTED',
      },
    ];

    const mockToleranceCriteria = [
      {
        discrepancyType: 'INVOICE_AMOUNT_MISMATCH',
        toleranceAmount: 10000,
        tolerancePercentage: 5,
        toleranceCount: 0,
      },
      {
        discrepancyType: 'CUSTOMER_MASTER_MISMATCH',
        toleranceAmount: 0,
        tolerancePercentage: 0,
        toleranceCount: 1,
      },
      {
        discrepancyType: 'PAYMENT_SCHEDULE_MISMATCH',
        toleranceAmount: 0,
        tolerancePercentage: 0,
        toleranceCount: 0,
      },
    ];

    const mockCorrectionMethods = [
      {
        discrepancyId: 'DISC-EXC-001',
        correctionMethod: 'MANUAL_REVIEW_REQUIRED',
        targetSystem: 'ACCOUNTING_SYSTEM',
        reason: '金額差異が許容値を超過し、手動確認が必要',
      },
      {
        discrepancyId: 'DISC-EXC-002',
        correctionMethod: 'MANUAL_REVIEW_REQUIRED',
        targetSystem: 'ACCOUNTING_SYSTEM',
        reason: '顧客マスタ不一致は手動修正が必須',
      },
      {
        discrepancyId: 'DISC-EXC-003',
        correctionMethod: 'MANUAL_REVIEW_REQUIRED',
        targetSystem: 'ACCOUNTING_SYSTEM',
        reason: '支払スケジュール差異は手動確認が必要',
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
      trackingRecordId: 'TRACK-20260115-001',
      savedRecords: 3,
      status: 'SUCCESS',
    });
  });

  it('全件が人手介入状態へ遷移される', async () => {
    const input = {
      executorUserId: 'user-sales-admin-001',
      discrepancyAnalysisContext: {
        analysisTimestamp: '2026-01-15T10:30:00Z',
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

    mockAiClient.generateNotification = jest.fn().mockResolvedValue({
      accounting: { sentAt: '2026-01-15T10:30:10Z', status: 'SUCCESS' },
      sales: { sentAt: '2026-01-15T10:30:12Z', status: 'SUCCESS' },
    });
    mockAiClient.executeAutoCorrection = jest.fn().mockResolvedValue({
      success: true,
      completedDiscrepancies: [],
    });

    const result = await runTx5Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('completed');
    expect(result.analysisResult.totalDiscrepanciesAnalyzed).toBe(3);
    expect(result.analysisResult.normalPatternCount).toBe(0);
    expect(result.analysisResult.exceptionPatternCount).toBe(3);
    expect(result.analysisResult.autoCompletedCount).toBe(0);
    expect(result.analysisResult.requiresManualInterventionCount).toBe(3);
    expect(result.autoCompletedDiscrepancies).toEqual([]);
    expect(result.exceptionDiscrepancies).toHaveLength(3);
    expect(result.exceptionDiscrepancies[0].discrepancyId).toBe('DISC-EXC-001');
    expect(result.exceptionDiscrepancies[0].exceptionReason).toBeDefined();
    expect(result.exceptionDiscrepancies[0].requiredManualAction).toBeDefined();
    expect(result.exceptionDiscrepancies[0].assignedTo).toBeDefined();
    expect(result.correctionInstructions).toHaveLength(3);
    expect(result.correctionInstructions[0].discrepancyId).toBe('DISC-EXC-001');
    expect(result.correctionInstructions[0].correctionMethod).toBe('MANUAL_REVIEW_REQUIRED');
    expect(result.correctionInstructions[0].targetSystem).toBe('ACCOUNTING_SYSTEM');
    expect(result.notificationsSent).toHaveLength(2);
    expect(result.notificationsSent[0].recipientEmail).toBe('accounting@company.com');
    expect(result.notificationsSent[0].deliveryStatus).toBe('SUCCESS');
    expect(result.notificationsSent[1].recipientEmail).toBe('sales-owner@company.com');
    expect(result.notificationsSent[1].deliveryStatus).toBe('SUCCESS');
    expect(result.accountingReportContent.reportGeneratedAt).toBeDefined();
    expect(result.accountingReportContent.exceptionPatternSummary).toBeDefined();
    expect(result.executionLog.length).toBeGreaterThan(0);
  });
});
