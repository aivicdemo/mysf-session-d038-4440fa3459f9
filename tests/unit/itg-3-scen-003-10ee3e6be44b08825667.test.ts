import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  runTx1Imp1Agent,
} from '../../src/agents/tx-1-imp-1/orchestrator';
import type { Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('SCEN-003: エラー：指定された対象月が月次締め可能な期間外である場合、InvalidMonthlyClosePeriodError が発生する', () => {
  let mockAiClient: Tx1Imp1AiClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAiClient = {};
  });

  it('should throw InvalidMonthlyClosePeriodError when target month is invalid (13th month)', async () => {
    const targetMonthYearYYYYMM = '202313';
    const executingUserId = 'user-001';
    const currentDateTime = new Date('2023-12-15T10:00:00Z');

    const input = {
      targetMonthYearYYYYMM,
      executingUserId,
      currentDateTime,
    };

    await expect(runTx1Imp1Agent(input, mockAiClient)).rejects.toThrow('InvalidMonthlyClosePeriodError');
    await expect(runTx1Imp1Agent(input, mockAiClient)).rejects.toThrow(
      '指定された対象月は月次締め処理の対象期間外です。'
    );
  });
});
