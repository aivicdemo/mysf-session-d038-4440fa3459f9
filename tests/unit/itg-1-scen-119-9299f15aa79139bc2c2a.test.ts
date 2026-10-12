import { generateInvoiceFromDeal } from '../../src/logic/invoice-generation-management';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-119: 商談IDが空または不正な形式のとき、例外発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error with message about invalid dealId when dealId is empty', async () => {
    const dealId = '';
    const currentDateTime = new Date('2026-10-07T10:30:00.000Z');
    const executingUserId = 'user-001';


    await expect(
      generateInvoiceFromDeal({
        dealId,
        currentDateTime,
        executingUserId,
      })
    ).rejects.toThrow('商談IDが不正です。正しい商談を選択してください');
  });
});
