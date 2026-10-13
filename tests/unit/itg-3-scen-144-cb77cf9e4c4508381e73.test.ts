import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  executeEscalationByDiscrepancySeverity,
  ExecuteEscalationByDiscrepancySeverityInput,
  InvalidDiscrepancySeverityError,
} from '../../src/logic/scheduled-monitoring-orchestrator';

describe('SCEN-144: 差異レコードの重大度が定義済みの値（critical, high, medium, low）以外の無効な値である場合、InvalidDiscrepancySeverityErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidDiscrepancySeverityError when severity is invalid', async () => {
    const input: ExecuteEscalationByDiscrepancySeverityInput = {
      discrepancies: [
        {
          discrepancyId: 'disc-001',
          severity: 'invalid_severity' as any,
          discrepancyType: 'amount_mismatch',
          amountDifference: 50000,
          affectedRecordCount: 3,
          detectionTimestamp: new Date('2026-01-15T10:30:00Z'),
        },
      ],
      executionTimestamp: new Date('2026-01-15T10:35:00Z'),
      monitoringCycleId: 'cycle-20260115-001',
    };

    await expect(executeEscalationByDiscrepancySeverity(input)).rejects.toThrow(
      InvalidDiscrepancySeverityError
    );

    await expect(executeEscalationByDiscrepancySeverity(input)).rejects.toThrow(
      '差異の重大度が無効です。重大度は critical, high, medium, low のいずれかである必要があります。'
    );
  });
});
