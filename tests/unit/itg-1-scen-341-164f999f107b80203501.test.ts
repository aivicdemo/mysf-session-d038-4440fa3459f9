import { classifyInvoiceStatus, DealNotFound } from '../../src/logic/invoice-status-classification';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchInvoiceLineItemsByInvoice: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-341: 商談IDが空文字列の場合、DealNotFound エラーが発生', () => {
  const dealId = '';
  const currentDateTime = new Date('2026-10-07T10:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('商談IDが空文字列の場合、DealNotFound エラーが発生する', async () => {
    (dataPersistence.fetchDealById as jest.Mock).mockRejectedValue(
      new DealNotFound('商談が見つかりません。商談ID: ')
    );

    await expect(classifyInvoiceStatus({
      dealId,
      currentDateTime,
    })).rejects.toThrow(DealNotFound);

    await expect(classifyInvoiceStatus({
      dealId,
      currentDateTime,
    })).rejects.toThrow('商談が見つかりません。商談ID: ');
  });
});
