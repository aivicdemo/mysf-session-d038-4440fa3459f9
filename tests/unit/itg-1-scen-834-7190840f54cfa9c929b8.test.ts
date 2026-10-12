import { fetchInvoiceById, InvoiceNotFound } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-834: fetchInvoiceById - InvoiceNotFound when record does not exist', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvoiceNotFound with correct message when invoice is not found', async () => {
    const invoiceId = '550e8400-e29b-41d4-a716-446655440000';

    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);

    await expect(fetchInvoiceById({ invoiceId })).rejects.toThrow(InvoiceNotFound);
    await expect(fetchInvoiceById({ invoiceId })).rejects.toThrow(
      '指定された請求書が見つかりません。請求書ID: 550e8400-e29b-41d4-a716-446655440000'
    );
  });
});
