import { runTx5Imp1Agent, type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';
import * as correctionMethodEngine from '../../src/logic/correction-method-determination-engine';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveDiscrepancyDetailsForConfirmation: jest.fn(),
  retrieveToleranceCriteriaByType: jest.fn(),
  saveCorrectionTrackingRecord: jest.fn(),
}));

jest.mock('../../src/logic/correction-method-determination-engine', () => ({
  ...jest.requireActual<typeof import('../../src/logic/correction-method-determination-engine')>('../../src/logic/correction-method-determination-engine'),
  determineCorrectionMethod: jest.fn(),
}));

describe('SCEN-013: runTx5Imp1Agent with mixed normal and exception patterns', () => {
  const mockDiscrepancyPersistence = discrepancyPersistence as jest.Mocked<typeof discrepancyPersistence>;
  const mockCorrectionMethodEngine = correctionMethodEngine as jest.Mocked<typeof correctionMethodEngine>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Precondition: 検出済み差異レコード一覧
    // Returns 3 discrepancies: disc-001 (normal), disc-002 (exception), disc-003 (normal)
    mockDiscrepancyPersistence.retrieveDiscrepancyDetailsForConfirmation.mockResolvedValue([
      {
        discrepancyId: 'disc-001',
        discrepancyType: 'amount_mismatch',
        detectedAmount: 15000,
        toleranceThreshold: 10000,
        sourceSystem: 'legacy_billing',
        targetSystem: 'sales_system',
        patternClassification: 'normal',
      },
      {
        discrepancyId: 'disc-002',
        discrepancyType: 'status_divergence',
        sourceStatus: 'completed',
        targetStatus: 'pending',
        sourceSystem: 'legacy_billing',
        targetSystem: 'sales_system',
        patternClassification: 'exception',
      },
      {
        discrepancyId: 'disc-003',
        discrepancyType: 'record_count_mismatch',
        sourceCount: 5,
        targetCount: 4,
        sourceSystem: 'legacy_billing',
        targetSystem: 'sales_system',
        patternClassification: 'normal',
      },
    ]);

    // Precondition: 差異許容基準マスタ
    mockDiscrepancyPersistence.retrieveToleranceCriteriaByType
      .mockResolvedValueOnce({
        discrepancyType: 'amount_mismatch',
        toleranceAmount: 20000,
        toleranceCount: 100,
        allowedStatusDifferences: [],
      })
      .mockResolvedValueOnce({
        discrepancyType: 'status_divergence',
        toleranceAmount: 0,
        toleranceCount: 0,
        allowedStatusDifferences: [],
      })
      .mockResolvedValueOnce({
        discrepancyType: 'record_count_mismatch',
        toleranceAmount: 0,
        toleranceCount: 1,
        allowedStatusDifferences: [],
      });

    // Precondition: 是正方法判定結果
    mockCorrectionMethodEngine.determineCorrectionMethod
      .mockResolvedValueOnce({
        discrepancyId: 'disc-001',
        correctionMethod: 'automatic_sync',
        targetSystem: 'sales_system',
        priority: 'medium',
        estimatedCorrectionTime: '5 minutes',
      })
      .mockResolvedValueOnce({
        discrepancyId: 'disc-002',
        correctionMethod: 'manual_review',
        targetSystem: 'sales_system',
        priority: 'high',
        estimatedCorrectionTime: '24 hours',
      })
      .mockResolvedValueOnce({
        discrepancyId: 'disc-003',
        correctionMethod: 'automatic_sync',
        targetSystem: 'sales_system',
        priority: 'medium',
        estimatedCorrectionTime: '5 minutes',
      });

    // Precondition: saveCorrectionTrackingRecord の戻り値
    mockDiscrepancyPersistence.saveCorrectionTrackingRecord.mockResolvedValue({
      success: true,
      trackedRecords: 3,
    });
  });

  it('should analyze discrepancies, auto-complete normal patterns, escalate exceptions, and send notifications', async () => {
    const executorUserId = 'user-sales-system-owner-001';
    const discrepancyAnalysisContext = {
      analysisTimestamp: '2026-01-15T10:00:00Z',
      targetPeriodStart: '2026-01-01',
      targetPeriodEnd: '2026-01-14',
      includeExceptionPatterns: true,
    };
    const notificationChannels = {
      accountingDepartmentEmail: 'accounting-team@company.com',
      salesSystemOwnerEmail: 'salesowner@company.com',
      escalationEnabled: true,
    };

    const mockAiClient: Tx5Imp1AiClient = {
      analyzeDiscrepancies: jest.fn().mockResolvedValue({
        analysis: 'normal_and_exception_mix',
      }),
      generateAccountingReport: jest.fn().mockResolvedValue({
        reportContent: 'accounting report with attachments',
        attachmentFileId: 'report-file-2026-01-15-001',
      }),
      generateCorrectionInstructions: jest.fn().mockResolvedValue({
        instructions: 'correction instructions for all discrepancies',
      }),
      sendNotifications: jest.fn().mockResolvedValue({
        notificationsSent: [
          {
            recipientEmail: 'accounting-team@company.com',
            notificationType: 'accounting_report',
            deliveryStatus: 'delivered',
          },
          {
            recipientEmail: 'salesowner@company.com',
            notificationType: 'correction_instructions',
            deliveryStatus: 'delivered',
          },
        ],
      }),
    };

    const result = await runTx5Imp1Agent(
      {
        executorUserId,
        discrepancyAnalysisContext,
        notificationChannels,
      },
      mockAiClient
    );

    expect(result.executionStatus).toBe('completed');
    expect(result.analysisResult).toEqual({
      totalDiscrepanciesAnalyzed: 3,
      normalPatternCount: 2,
      exceptionPatternCount: 1,
      autoCompletedCount: 2,
      requiresManualInterventionCount: 1,
    });

    expect(result.autoCompletedDiscrepancies).toContainEqual(
      expect.objectContaining({
        discrepancyId: 'disc-001',
        completionMethod: 'automatic_sync',
        verificationResult: 'success',
      })
    );
    expect(result.autoCompletedDiscrepancies).toContainEqual(
      expect.objectContaining({
        discrepancyId: 'disc-003',
        completionMethod: 'automatic_sync',
        verificationResult: 'success',
      })
    );

    expect(result.exceptionDiscrepancies).toContainEqual(
      expect.objectContaining({
        discrepancyId: 'disc-002',
        exceptionReason: 'status_divergence',
        requiredManualAction: 'manual_review',
      })
    );

    expect(result.correctionInstructions).toHaveLength(3);
    result.correctionInstructions.forEach((instruction) => {
      expect(instruction).toHaveProperty('discrepancyId');
      expect(instruction).toHaveProperty('correctionMethod');
      expect(instruction.targetSystem).toBe('sales_system');
      expect(instruction).toHaveProperty('instructionContent');
      expect(instruction).toHaveProperty('priority');
    });

    expect(result.accountingReportContent).toEqual(
      expect.objectContaining({
        reportGeneratedAt: '2026-01-15T10:00:00Z',
        discrepancySummary: expect.any(String),
        normalPatternSummary: expect.any(String),
        exceptionPatternSummary: expect.any(String),
        attachmentFileId: 'report-file-2026-01-15-001',
      })
    );

    expect(result.notificationsSent).toHaveLength(2);
    expect(result.notificationsSent[0]).toEqual(
      expect.objectContaining({
        recipientEmail: 'accounting-team@company.com',
        notificationType: 'accounting_report',
        deliveryStatus: 'delivered',
      })
    );
    expect(result.notificationsSent[1]).toEqual(
      expect.objectContaining({
        recipientEmail: 'salesowner@company.com',
        notificationType: 'correction_instructions',
        deliveryStatus: 'delivered',
      })
    );

    expect(result.executionLog).toBeInstanceOf(Array);
    expect(result.executionLog.length).toBeGreaterThan(0);
    const eventTypes = result.executionLog.map((log) => log.eventType);
    expect(eventTypes).toContain('authorization_check_succeeded');
    expect(eventTypes).toContain('analysis_completed');
    expect(eventTypes).toContain('auto_completion_executed');
    expect(eventTypes).toContain('manual_intervention_transition');
    expect(eventTypes).toContain('notifications_sent');
  });
});
