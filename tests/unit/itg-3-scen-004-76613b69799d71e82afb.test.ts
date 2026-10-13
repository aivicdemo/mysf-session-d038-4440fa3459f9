import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  runTx1Imp1Agent,
} from '../../src/agents/tx-1-imp-1/orchestrator';
import type { Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';
import * as authValidation from '../../src/logic/authorization-validation';
import * as dataRetrieval from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-004: エラー：旧新システムからのデータ取得に失敗した場合、DataRetrievalFailureError が発生する', () => {
  let mockAiClient: Tx1Imp1AiClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAiClient = {};
  });

  it('should throw DataRetrievalFailureError when data retrieval from legacy/new systems fails', async () => {
    const targetMonthYearYYYYMM = '202401';
    const executingUserId = 'user-001';
    const currentDateTime = new Date('2024-02-10T10:30:00Z');

    // Mock validateUserAuthorizationForDiscrepancyConfirmation
    jest.spyOn(authValidation, 'validateUserAuthorizationForDiscrepancyConfirmation').mockResolvedValue({
      isAuthorized: true,
      userId: executingUserId,
      authorizedAt: '2024-02-10T10:30:00Z',
    } as any);

    // Mock retrieveLegacyAndNewSystemInvoiceData to throw DataRetrievalFailureError
    const error = new Error('旧新システムからのデータ取得に失敗しました。');
    error.name = 'DataRetrievalFailureError';
    jest.spyOn(dataRetrieval, 'retrieveLegacyAndNewSystemInvoiceData').mockRejectedValue(error);

    const input = {
      targetMonthYearYYYYMM,
      executingUserId,
      currentDateTime,
    };

    await expect(runTx1Imp1Agent(input, mockAiClient)).rejects.toThrow('DataRetrievalFailureError');
    await expect(runTx1Imp1Agent(input, mockAiClient)).rejects.toThrow(
      '旧新システムからのデータ取得に失敗しました。'
    );
  });
});
