import { executeEscalationByDiscrepancySeverity, type ExecuteEscalationByDiscrepancySeverityInput, type ExecuteEscalationByDiscrepancySeverityOutput } from '../../src/logic/scheduled-monitoring-orchestrator';

describe('SCEN-151: Escalation by severity - multi-level notification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should escalate critical severity to all levels, high to accounting and IT, medium to accounting only', async () => {

    const input: ExecuteEscalationByDiscrepancySeverityInput = {
      discrepancies: [
        {
          discrepancyId: 'DISC-001',
          severity: 'critical',
          discrepancyType: 'revenue_amount_mismatch',
          amountDifference: 50000,
          affectedRecordCount: 3,
          detectionTimestamp: new Date('2026-10-07T10:00:00.000Z'),
        },
        {
          discrepancyId: 'DISC-002',
          severity: 'high',
          discrepancyType: 'invoice_count_mismatch',
          amountDifference: 15000,
          affectedRecordCount: 2,
          detectionTimestamp: new Date('2026-10-07T10:05:00.000Z'),
        },
        {
          discrepancyId: 'DISC-003',
          severity: 'medium',
          discrepancyType: 'payment_date_discrepancy',
          amountDifference: 5000,
          affectedRecordCount: 1,
          detectionTimestamp: new Date('2026-10-07T10:10:00.000Z'),
        },
      ],
      executionTimestamp: new Date('2026-10-07T10:15:00.000Z'),
      monitoringCycleId: 'CYCLE-20261007-001',
    };

    const result: ExecuteEscalationByDiscrepancySeverityOutput = await executeEscalationByDiscrepancySeverity(input);

    expect(result.escalationExecuted).toBe(true);
    expect(result.totalEscalationsAttempted).toBe(9);
    expect(result.totalEscalationsSucceeded).toBe(9);
    expect(result.escalationDetails).toHaveLength(3);

    const salesOpsDetail = result.escalationDetails.find((d) => d.recipientRole === 'sales_operations');
    expect(salesOpsDetail).toBeDefined();
    expect(salesOpsDetail?.recipientCount).toBe(1);
    expect(salesOpsDetail?.discrepancyCount).toBe(1);
    expect(salesOpsDetail?.slaDeadline).toEqual(new Date('2026-10-08T17:00:00.000Z'));

    const accountingDetail = result.escalationDetails.find((d) => d.recipientRole === 'accounting');
    expect(accountingDetail).toBeDefined();
    expect(accountingDetail?.recipientCount).toBe(2);
    expect(accountingDetail?.discrepancyCount).toBe(3);

    const itOpsDetail = result.escalationDetails.find((d) => d.recipientRole === 'it_operations');
    expect(itOpsDetail).toBeDefined();
    expect(itOpsDetail?.recipientCount).toBe(1);
    expect(itOpsDetail?.discrepancyCount).toBe(2);
  });
});
