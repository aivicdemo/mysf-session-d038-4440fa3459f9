import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  executeEscalationByDiscrepancySeverity,
  ExecuteEscalationByDiscrepancySeverityInput,
  ExecuteEscalationByDiscrepancySeverityOutput,
} from '../../src/logic/scheduled-monitoring-orchestrator';

describe('SCEN-143: 複数の差異が異なる重大度で検出された場合、重大度ごとに段階的な報告先が決定され、各段階の報告内容・SLA期限・送信状況がまとめて返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should execute escalation with multiple severity levels and return detailed escalation info', async () => {
    const input: ExecuteEscalationByDiscrepancySeverityInput = {
      discrepancies: [
        {
          discrepancyId: 'DISC-001',
          severity: 'critical',
          discrepancyType: 'invoice_amount_mismatch',
          amountDifference: 500000,
          affectedRecordCount: 3,
          detectionTimestamp: new Date('2026-01-15T09:00:00Z'),
        },
        {
          discrepancyId: 'DISC-002',
          severity: 'high',
          discrepancyType: 'sales_order_missing',
          amountDifference: 150000,
          affectedRecordCount: 5,
          detectionTimestamp: new Date('2026-01-15T09:05:00Z'),
        },
        {
          discrepancyId: 'DISC-003',
          severity: 'medium',
          discrepancyType: 'line_item_quantity_variance',
          amountDifference: 25000,
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

    const criticalDetails = result.escalationDetails!.find(d => d.recipientRole === 'it_operations');
    expect(criticalDetails).toBeDefined();
    expect(criticalDetails!.recipientCount).toBe(2);
    expect(criticalDetails!.discrepancyCount).toBe(1);
    expect(criticalDetails!.slaDeadline).toEqual(new Date('2026-01-16T17:00:00Z'));
    expect(criticalDetails!.notificationSentAt).toBeInstanceOf(Date);

    const highDetails = result.escalationDetails!.find(d => d.recipientRole === 'accounting');
    expect(highDetails).toBeDefined();
    expect(highDetails!.recipientCount).toBe(2);
    expect(highDetails!.discrepancyCount).toBe(1);
    expect(highDetails!.slaDeadline).toEqual(new Date('2026-01-17T17:00:00Z'));

    const mediumDetails = result.escalationDetails!.find(d => d.recipientRole === 'sales_operations');
    expect(mediumDetails).toBeDefined();
    expect(mediumDetails!.recipientCount).toBe(1);
    expect(mediumDetails!.discrepancyCount).toBe(1);
    expect(mediumDetails!.slaDeadline).toEqual(new Date('2026-01-20T17:00:00Z'));

    expect(result.failedEscalations).toEqual([]);
    expect(result.totalEscalationsAttempted).toBe(3);
    expect(result.totalEscalationsSucceeded).toBe(3);
  });
});
