import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  executeEscalationByDiscrepancySeverity,
  ExecuteEscalationByDiscrepancySeverityInput,
  ExecuteEscalationByDiscrepancySeverityOutput,
} from '../../src/logic/scheduled-monitoring-orchestrator';

describe('SCEN-150: 一部のエスカレーション送信に失敗した場合でも、成功したエスカレーション結果は出力に含まれ、失敗したエスカレーションの詳細が記録される', () => {
  beforeEach(() => {
    // No setup needed
  });

  it('should return successful escalations and record failed ones when partial send failure occurs', async () => {
    const input: ExecuteEscalationByDiscrepancySeverityInput = {
      discrepancies: [
        {
          discrepancyId: 'DIFF-001',
          severity: 'critical',
          discrepancyType: 'revenue_mismatch',
          amountDifference: 50000,
          affectedRecordCount: 3,
          detectionTimestamp: new Date('2026-01-15T09:00:00Z'),
        },
        {
          discrepancyId: 'DIFF-002',
          severity: 'high',
          discrepancyType: 'invoice_count_mismatch',
          amountDifference: 15000,
          affectedRecordCount: 5,
          detectionTimestamp: new Date('2026-01-15T09:05:00Z'),
        },
        {
          discrepancyId: 'DIFF-003',
          severity: 'medium',
          discrepancyType: 'line_item_mismatch',
          amountDifference: 5000,
          affectedRecordCount: 2,
          detectionTimestamp: new Date('2026-01-15T09:10:00Z'),
        },
      ],
      executionTimestamp: new Date('2026-01-15T10:00:00Z'),
      monitoringCycleId: 'CYCLE-20260115-001',
    };


    const result: ExecuteEscalationByDiscrepancySeverityOutput = await executeEscalationByDiscrepancySeverity(input);

    expect(result.escalationExecuted).toBe(true);
    expect(result.escalationDetails).toBeDefined();
    expect(result.escalationDetails!.length).toBe(3);

    const salesOpsDetails = result.escalationDetails!.find(
      d => d.recipientRole === 'sales_operations'
    );
    expect(salesOpsDetails).toBeDefined();
    expect(salesOpsDetails!.recipientCount).toBe(2);
    expect(salesOpsDetails!.discrepancyCount).toBe(2);

    const accountingDetails = result.escalationDetails!.find(
      d => d.recipientRole === 'accounting'
    );
    expect(accountingDetails).toBeDefined();
    expect(accountingDetails!.recipientCount).toBe(1);
    expect(accountingDetails!.discrepancyCount).toBe(2);

    const itOpsDetails = result.escalationDetails!.find(
      d => d.recipientRole === 'it_operations'
    );
    expect(itOpsDetails).toBeDefined();
    expect(itOpsDetails!.recipientCount).toBe(2);
    expect(itOpsDetails!.discrepancyCount).toBe(1);

    expect(result.totalEscalationsAttempted).toBe(7);
    expect(result.totalEscalationsSucceeded).toBe(6);

    expect(result.failedEscalations).toBeDefined();
    expect(result.failedEscalations!.length).toBe(1);
    const failedEntry = result.failedEscalations![0];
    expect(failedEntry.discrepancyId).toBe('DIFF-001');
    expect(failedEntry.recipientRole).toBe('accounting');
    expect(failedEntry.failureReason).toBe(
      'Email service timeout for recipient accounting-1@company.com'
    );
  });
});
