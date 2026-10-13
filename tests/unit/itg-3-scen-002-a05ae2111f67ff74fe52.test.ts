import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  runTx1Imp1Agent,
} from '../../src/agents/tx-1-imp-1/orchestrator';
import type { Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';
import * as authValidation from '../../src/logic/authorization-validation';

describe('SCEN-002: エラー：実行ユーザーが月次締め承認権限を持たない場合、UnauthorizedUserError が発生する', () => {
  let mockAiClient: Tx1Imp1AiClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAiClient = {};
  });

  it('should throw UnauthorizedUserError when executing user lacks monthly close approval authority', async () => {
    const targetMonthYearYYYYMM = '202401';
    const executingUserId = 'user-999';
    const currentDateTime = new Date('2024-02-15T10:30:00Z');

    // Mock validateUserAuthorizationForDiscrepancyConfirmation to return unauthorized
    jest.spyOn(authValidation, 'validateUserAuthorizationForDiscrepancyConfirmation').mockResolvedValue({
      isAuthorized: false,
      userId: executingUserId,
      authorizedAt: '2024-02-15T10:30:00Z',
    } as any);

    const input = {
      targetMonthYearYYYYMM,
      executingUserId,
      currentDateTime,
    };

    await expect(runTx1Imp1Agent(input, mockAiClient)).rejects.toThrow('UnauthorizedUserError');
    await expect(runTx1Imp1Agent(input, mockAiClient)).rejects.toThrow(
      '月次締め承認権限がないため処理を実行できません。'
    );
  });
});
