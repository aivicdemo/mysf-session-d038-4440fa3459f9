import { executeEscalationByDiscrepancySeverity, type ExecuteEscalationByDiscrepancySeverityInput, type ExecuteEscalationByDiscrepancySeverityOutput } from '../../src/logic/scheduled-monitoring-orchestrator';

describe('SCEN-152: Unified monitoring cycle ID in escalations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should include unified monitoringCycleId in all escalation notifications', async () => {

    const input: ExecuteEscalationByDiscrepancySeverityInput = {
      discrepancies: [
        {
          discrepancyId: 'DISC-001',
          severity: 'critical',
          discrepancyType: 'sales_amount_mismatch',
          amountDifference: 50000,
          affectedRecordCount: 3,
          detectionTimestamp: new Date('2026-10-07T10:00:00Z'),
        },
        {
          discrepancyId: 'DISC-002',
          severity: 'high',
          discrepancyType: 'invoice_record_count_mismatch',
          amountDifference: 20000,
          affectedRecordCount: 5,
          detectionTimestamp: new Date('2026-10-07T10:05:00Z'),
        },
      ],
      executionTimestamp: new Date('2026-10-07T10:15:00Z'),
      monitoringCycleId: 'CYCLE-20261007-001',
    };

    const result: ExecuteEscalationByDiscrepancySeverityOutput = await executeEscalationByDiscrepancySeverity(input);

    expect(result.escalationExecuted).toBe(true);
    expect(result.totalEscalationsAttempted).toBe(3);
    expect(result.totalEscalationsSucceeded).toBe(3);
    expect(result.failedEscalations).toEqual([]);

    expect(result.escalationDetails).toHaveLength(2);

    const salesOpsDetail = result.escalationDetails.find((d) => d.recipientRole === 'sales_operations');
    expect(salesOpsDetail).toBeDefined();
    expect(salesOpsDetail?.recipientCount).toBe(2);
    expect(salesOpsDetail?.discrepancyCount).toBe(1);
    expect(salesOpsDetail?.slaDeadline).toEqual(new Date('2026-10-08T17:00:00Z'));

    const accountingDetail = result.escalationDetails.find((d) => d.recipientRole === 'accounting');
    expect(accountingDetail).toBeDefined();
    expect(accountingDetail?.recipientCount).toBe(1);
    expect(accountingDetail?.discrepancyCount).toBe(1);
    expect(accountingDetail?.slaDeadline).toEqual(new Date('2026-10-08T17:00:00Z'));
  });
});
