import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  judgeInvoiceStatusConsistency,
  DealNotFound,
} from '../../src/logic/invoice-status-judgment';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-273: 商談IDが空または不正な形式の場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('DealNotFoundエラーが発生する', async () => {
    const dealId = '';
    const executedAt = new Date('2026-10-07T10:00:00.000Z');

    (
      dataPersistence.fetchDealById as jest.MockedFunction<
        typeof dataPersistence.fetchDealById
      >
    ).mockRejectedValue(new DealNotFound('商談が見つかりません。'));

    await expect(
      judgeInvoiceStatusConsistency({
        dealId,
        executedAt,
      })
    ).rejects.toThrow(DealNotFound);

    await expect(
      judgeInvoiceStatusConsistency({
        dealId,
        executedAt,
      })
    ).rejects.toThrow('商談が見つかりません。');

    expect(dataPersistence.fetchDealById).toHaveBeenCalled();
  });
});
