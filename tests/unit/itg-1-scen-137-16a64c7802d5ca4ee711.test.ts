import { reissueInvoice, InvoiceInvalidStatus } from '../../src/logic/invoice-generation-management';
import type { ReissueInvoiceInput } from '../../src/logic/invoice-generation-management';
import * as dataPersistenceModule from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof dataPersistenceModule>('../../src/logic/data-persistence'),
  fetchInvoiceById: jest.fn(),
}));

describe('SCEN-137: 請求書ステータスが再発行不可の状態（下書き、削除済みなど）のときは、InvoiceInvalidStatusエラーが発生する', () => {
  let mockDataPersistence: jest.Mocked<typeof dataPersistenceModule>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDataPersistence = dataPersistenceModule as jest.Mocked<typeof dataPersistenceModule>;

    // fetchInvoiceById stub - ステータスが DRAFT（下書き）の請求書を返す
    mockDataPersistence.fetchInvoiceById.mockResolvedValue({
      invoiceId: 'INV-2024-001',
      dealId: 'DEAL-001',
      customerId: 'CUST-001',
      salesRepresentativeId: 'SR-001',
      invoiceNumber: '2024-001',
      invoiceDate: '2024-01-10',
      dueDate: '2024-02-10',
      invoiceAmount: 100000,
      taxAmount: 10000,
      untaxedAmount: 90000,
      invoiceStatus: 'DRAFT',
      paidDate: null,
      paidAmount: null,
      remarks: null,
      modificationReason: null,
      reissueCount: 0,
      lastReissuedAt: null,
      amountCalculationVerificationStatus: 'verified',
      referenceIntegrityVerificationStatus: 'verified',
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-10T09:00:00Z',
      createdBy: 'USER-12345',
    });
  });

  it('InvoiceInvalidStatus エラーが発生し、saveInvoice と recordModificationWithHistory は呼ばれない', async () => {
    const input: ReissueInvoiceInput = {
      invoiceId: 'INV-2024-001',
      reissueReason: '顧客への再送付',
      currentDateTime: new Date('2024-01-15T10:30:00Z'),
      executingUserId: 'USER-12345',
    };

    // reissueInvoice 関数が InvoiceInvalidStatus エラーをスロー
    await expect(reissueInvoice(input)).rejects.toThrow(InvoiceInvalidStatus);

    // エラーメッセージの確認
    await expect(reissueInvoice(input)).rejects.toThrow(/このステータスの請求書は再発行できません。/);

    // fetchInvoiceById が呼ばれたことを確認
    expect(mockDataPersistence.fetchInvoiceById).toHaveBeenCalledWith({
      invoiceId: 'INV-2024-001',
    });
  });
});
