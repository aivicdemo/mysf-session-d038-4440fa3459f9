import { monitorCorrectionSLACompliance, type MonitorCorrectionSLAComplianceInput } from '../../src/logic/scheduled-monitoring-orchestrator';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
}));

describe('SCEN-156: SLA超過レコードが存在し、重大度別に異なるエスカレーション対象者が特定される場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('受信者ごとの通知内容と送信日時を含めて報告する', async () => {
    const currentTimestamp = new Date('2025-01-16T10:30:00Z');

    const correctionRecords = [
      {
        correctionId: 'CORR-001',
        differenceId: 'DIFF-A001',
        differenceType: 'billing_amount',
        severity: 'critical',
        detectedAt: '2025-01-12T08:00:00Z',
        completedAt: null,
        status: 'in_progress',
      },
      {
        correctionId: 'CORR-002',
        differenceId: 'DIFF-B002',
        differenceType: 'product_quantity',
        severity: 'high',
        detectedAt: '2025-01-11T14:00:00Z',
        completedAt: null,
        status: 'in_progress',
      },
      {
        correctionId: 'CORR-003',
        differenceId: 'DIFF-C003',
        differenceType: 'billing_date',
        severity: 'medium',
        detectedAt: '2025-01-10T09:00:00Z',
        completedAt: '2025-01-14T16:00:00Z',
        status: 'completed',
      },
      {
        correctionId: 'CORR-004',
        differenceId: 'DIFF-D004',
        differenceType: 'billing_amount',
        severity: 'high',
        detectedAt: '2025-01-09T10:00:00Z',
        completedAt: null,
        status: 'in_progress',
      },
    ];

    const toleranceCriteria = {
      billing_amount: { slaHours: 24 },
      product_quantity: { slaHours: 48 },
      billing_date: { slaHours: 72 },
    };

    (discrepancyPersistence.retrieveMonitoringLogsAndCorrectionHistory as jest.Mock).mockResolvedValue({
      correctionTrackingHistory: correctionRecords,
    });

    (discrepancyPersistence.retrieveToleranceCriteriaByType as jest.Mock)
      .mockImplementation((input: any) => {
        const criteria = toleranceCriteria[input.discrepancyType as keyof typeof toleranceCriteria];
        return Promise.resolve(criteria ? { slaHours: criteria.slaHours } : null);
      });

    const input: MonitorCorrectionSLAComplianceInput = {
      monitoringCycleId: 'CYCLE-20250115-001',
      targetPeriodStart: new Date('2025-01-10T00:00:00Z'),
      targetPeriodEnd: new Date('2025-01-15T23:59:59Z'),
      currentTimestamp: currentTimestamp,
    };

    const result = await monitorCorrectionSLACompliance(input);

    expect(result.monitoringCycleId).toBe('CYCLE-20250115-001');
    expect(result.slaComplianceStatus).toBe('exceeded');
    expect(result.totalCorrectionRecordsMonitored).toBe(4);
    expect(result.compliantRecordCount).toBe(1);
    expect(result.atRiskRecordCount).toBe(0);
    expect(result.exceededRecordCount).toBe(3);
    expect(result.escalationExecuted).toBe(true);
    expect(result.errorDetails).toBeNull();

    const exceededDetails = result.slaExceededDetails;
    expect(exceededDetails).toHaveLength(3);

    const corr001 = exceededDetails.find(d => d.correctionId === 'CORR-001');
    expect(corr001).toBeTruthy();
    expect(corr001?.exceedanceHours).toBe(26);
    expect(corr001?.severity).toBe('critical');
    expect(corr001?.escalationRecipientRole).toBe('sales_operations');

    const corr002 = exceededDetails.find(d => d.correctionId === 'CORR-002');
    expect(corr002).toBeTruthy();
    expect(corr002?.exceedanceHours).toBe(20);
    expect(corr002?.severity).toBe('high');
    expect(corr002?.escalationRecipientRole).toBe('accounting');

    const corr004 = exceededDetails.find(d => d.correctionId === 'CORR-004');
    expect(corr004).toBeTruthy();
    expect(corr004?.exceedanceHours).toBe(144);
    expect(corr004?.severity).toBe('high');
    expect(corr004?.escalationRecipientRole).toBe('it_operations');

    expect(result.escalationDetails).toBeTruthy();
    expect(result.escalationDetails).toHaveLength(3);

    const salesOpsEscalation = result.escalationDetails?.find(d => d.recipientRole === 'sales_operations');
    expect(salesOpsEscalation).toBeTruthy();
    expect(salesOpsEscalation?.exceededRecordCount).toBe(1);

    const accountingEscalation = result.escalationDetails?.find(d => d.recipientRole === 'accounting');
    expect(accountingEscalation).toBeTruthy();
    expect(accountingEscalation?.exceededRecordCount).toBe(1);

    const itOpsEscalation = result.escalationDetails?.find(d => d.recipientRole === 'it_operations');
    expect(itOpsEscalation).toBeTruthy();
    expect(itOpsEscalation?.exceededRecordCount).toBe(1);
  });
});
