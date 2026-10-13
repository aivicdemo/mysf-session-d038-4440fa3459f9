import { monitorCorrectionSLACompliance, type MonitorCorrectionSLAComplianceInput } from '../../src/logic/scheduled-monitoring-orchestrator';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
}));

describe('SCEN-155: 監視対象期間内に是正レコードがあり、一部がSLA期限を超過している場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exceeded状態で超過レコードの詳細と重大度別の区分を報告する', async () => {
    const currentTimestamp = new Date('2025-01-08T10:00:00Z');

    const correctionRecords = [
      {
        correctionId: 'CORR-001',
        differenceId: 'DIFF-SALES-001',
        differenceType: 'sales_order_amount',
        detectionTimestamp: '2025-01-02T08:00:00Z',
        completionTimestamp: '2025-01-03T14:00:00Z',
        severity: 'critical',
        status: 'completed',
      },
      {
        correctionId: 'CORR-002',
        differenceId: 'DIFF-AR-001',
        differenceType: 'accounts_receivable_reconciliation',
        detectionTimestamp: '2025-01-03T09:00:00Z',
        completionTimestamp: null,
        severity: 'high',
        status: 'in_progress',
      },
      {
        correctionId: 'CORR-003',
        differenceId: 'DIFF-IT-001',
        differenceType: 'system_integration_error',
        detectionTimestamp: '2025-01-04T10:00:00Z',
        completionTimestamp: null,
        severity: 'medium',
        status: 'in_progress',
      },
      {
        correctionId: 'CORR-004',
        differenceId: 'DIFF-AR-002',
        differenceType: 'accounts_receivable_reconciliation',
        detectionTimestamp: '2025-01-02T12:00:00Z',
        completionTimestamp: null,
        severity: 'high',
        status: 'in_progress',
      },
    ];

    const toleranceCriteria = {
      sales_order_amount: { slaHours: 24 },
      accounts_receivable_reconciliation: { slaHours: 48 },
      system_integration_error: { slaHours: 72 },
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
      monitoringCycleId: 'CYCLE-20250107-001',
      targetPeriodStart: new Date('2025-01-01T00:00:00Z'),
      targetPeriodEnd: new Date('2025-01-07T23:59:59Z'),
      currentTimestamp: currentTimestamp,
    };

    const result = await monitorCorrectionSLACompliance(input);

    expect(result.monitoringCycleId).toBe('CYCLE-20250107-001');
    expect(result.slaComplianceStatus).toBe('exceeded');
    expect(result.totalCorrectionRecordsMonitored).toBe(4);
    expect(result.compliantRecordCount).toBe(2);
    expect(result.atRiskRecordCount).toBe(0);
    expect(result.exceededRecordCount).toBe(2);
    expect(result.escalationExecuted).toBe(true);
    expect(result.errorDetails).toBeNull();

    const exceededDetails = result.slaExceededDetails;
    expect(exceededDetails).toHaveLength(2);
    expect(exceededDetails[0].correctionId).toBe('CORR-004');
    expect(exceededDetails[0].exceedanceHours).toBe(118);
    expect(exceededDetails[0].severity).toBe('high');
    expect(exceededDetails[1].correctionId).toBe('CORR-002');
    expect(exceededDetails[1].exceedanceHours).toBe(73);
    expect(exceededDetails[1].severity).toBe('high');

    expect(result.escalationDetails).toBeTruthy();
    const accountingEscalation = result.escalationDetails?.find(d => d.recipientRole === 'accounting');
    expect(accountingEscalation).toBeTruthy();
    expect(accountingEscalation?.exceededRecordCount).toBe(2);
  });
});
