import { reissueInvoice, InvoiceNotFound } from '../../src/logic/invoice-generation-management';
import type { ReissueInvoiceInput } from '../../src/logic/invoice-generation-management';
import * as dataPersistenceModule from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof dataPersistenceModule>('../../src/logic/data-persistence'),
  fetchInvoiceById: jest.fn(),
}));

describe('SCEN-136: 再発行対象の請求書IDが存在しないとき、InvoiceNotFoundエラーが発生する', () => {
  let mockDataPersistence: jest.Mocked<typeof dataPersistenceModule>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDataPersistence = dataPersistenceModule as jest.Mocked<typeof dataPersistenceModule>;

    // fetchInvoiceById stub - null を返す（請求書が存在しない）
    mockDataPersistence.fetchInvoiceById.mockResolvedValue(null as any);
  });

  it('InvoiceNotFound エラーが発生し、エラー文言が返される', async () => {
    const input: ReissueInvoiceInput = {
      invoiceId: 'INV-999999',
      reissueReason: '顧客への再送付',
      currentDateTime: new Date('2026-10-07T10:30:00Z'),
      executingUserId: 'USER-12345',
    };

    // reissueInvoice 関数が InvoiceNotFound エラーをスロー
    await expect(reissueInvoice(input)).rejects.toThrow(InvoiceNotFound);

    // エラーメッセージの確認
    await expect(reissueInvoice(input)).rejects.toThrow(/請求書が見つかりません。請求書IDを確認してください。/);

    // fetchInvoiceById が呼ばれたことを確認
    expect(mockDataPersistence.fetchInvoiceById).toHaveBeenCalledWith({
      invoiceId: 'INV-999999',
    });
  });
});
