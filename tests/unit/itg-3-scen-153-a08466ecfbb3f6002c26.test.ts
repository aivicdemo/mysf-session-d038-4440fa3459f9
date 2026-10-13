import { monitorCorrectionSLACompliance, type MonitorCorrectionSLAComplianceInput, type MonitorCorrectionSLAComplianceOutput } from '../../src/logic/scheduled-monitoring-orchestrator';
import * as persistenceLogic from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveMonitoringLogsAndCorrectionHistory: jest.fn(),
  retrieveToleranceCriteriaByType: jest.fn(),
}));

describe('SCEN-153: Monitor correction SLA compliance - all compliant', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should report all corrections as compliant when completed within SLA', async () => {
    const mockRetrieveMonitoringLogsAndCorrectionHistory =
      persistenceLogic.retrieveMonitoringLogsAndCorrectionHistory as jest.Mock;
    const mockRetrieveToleranceCriteriaByType =
      persistenceLogic.retrieveToleranceCriteriaByType as jest.Mock;

    mockRetrieveMonitoringLogsAndCorrectionHistory.mockResolvedValue([
      {
        correctionId: 'CORR-001',
        differenceId: 'DIFF-001',
        differenceType: 'invoice_amount_mismatch',
        detectionDate: new Date('2025-01-05T08:00:00Z'),
        completionDate: new Date('2025-01-10T14:30:00Z'),
        status: 'completed',
      },
      {
        correctionId: 'CORR-002',
        differenceId: 'DIFF-002',
        differenceType: 'billing_detail_discrepancy',
        detectionDate: new Date('2025-01-08T09:15:00Z'),
        completionDate: new Date('2025-01-12T16:45:00Z'),
        status: 'completed',
      },
      {
        correctionId: 'CORR-003',
        differenceId: 'DIFF-003',
        differenceType: 'transaction_line_item_error',
        detectionDate: new Date('2025-01-12T10:00:00Z'),
        completionDate: new Date('2025-01-14T11:20:00Z'),
        status: 'completed',
      },
    ]);

    mockRetrieveToleranceCriteriaByType.mockResolvedValue([
      { differenceType: 'invoice_amount_mismatch', slaDayLimit: 5 },
      { differenceType: 'billing_detail_discrepancy', slaDayLimit: 4 },
      { differenceType: 'transaction_line_item_error', slaDayLimit: 3 },
    ]);

    const input: MonitorCorrectionSLAComplianceInput = {
      monitoringCycleId: 'CYCLE-20250101-001',
      targetPeriodStart: new Date('2025-01-01T00:00:00Z'),
      targetPeriodEnd: new Date('2025-01-31T23:59:59Z'),
      currentTimestamp: new Date('2025-01-15T10:00:00Z'),
    };

    const result: MonitorCorrectionSLAComplianceOutput = await monitorCorrectionSLACompliance(input);

    expect(result.monitoringCycleId).toBe('CYCLE-20250101-001');
    expect(result.slaComplianceStatus).toBe('compliant');
    expect(result.totalCorrectionRecordsMonitored).toBe(3);
    expect(result.compliantRecordCount).toBe(3);
    expect(result.atRiskRecordCount).toBe(0);
    expect(result.exceededRecordCount).toBe(0);
    expect(result.slaExceededDetails).toEqual([]);
    expect(result.escalationExecuted).toBe(false);
    expect(result.escalationDetails).toBeNull();
    expect(result.errorDetails).toBeNull();
  });
});
