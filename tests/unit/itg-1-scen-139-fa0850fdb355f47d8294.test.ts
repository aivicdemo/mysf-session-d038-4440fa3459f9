import { reissueInvoice, InvoiceUpdateFailed } from '../../src/logic/invoice-generation-management';
import type { ReissueInvoiceInput } from '../../src/logic/invoice-generation-management';
import * as dataPersistenceModule from '../../src/logic/data-persistence';
import * as modificationTrackingModule from '../../src/logic/modification-tracking';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof dataPersistenceModule>('../../src/logic/data-persistence'),
  fetchInvoiceById: jest.fn(),
  saveInvoice: jest.fn(),
}));

jest.mock('../../src/logic/modification-tracking', () => ({
  ...jest.requireActual<typeof modificationTrackingModule>('../../src/logic/modification-tracking'),
  retrieveModificationHistoryByTargetRecord: jest.fn(),
  recordModificationWithHistory: jest.fn(),
}));

describe('SCEN-139: 請求書レコードの更新に失敗したとき、InvoiceUpdateFailedエラーが発生する', () => {
  let mockDataPersistence: jest.Mocked<typeof dataPersistenceModule>;
  let mockModificationTracking: jest.Mocked<typeof modificationTrackingModule>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDataPersistence = dataPersistenceModule as jest.Mocked<typeof dataPersistenceModule>;
    mockModificationTracking = modificationTrackingModule as jest.Mocked<typeof modificationTrackingModule>;

    // fetchInvoiceById stub - 有効な請求書を返す
    mockDataPersistence.fetchInvoiceById.mockResolvedValue({
      invoiceId: 'INV-20250107-001',
      dealId: 'DEAL-001',
      customerId: 'CUST-999',
      salesRepresentativeId: 'SR-001',
      invoiceNumber: '2025-0001',
      invoiceDate: '2025-01-07',
      dueDate: '2025-02-07',
      invoiceAmount: 100000,
      taxAmount: 10000,
      untaxedAmount: 90000,
      invoiceStatus: 'issued',
      paidDate: null,
      paidAmount: null,
      remarks: null,
      modificationReason: null,
      reissueCount: 1,
      lastReissuedAt: '2025-01-06T10:00:00Z',
      amountCalculationVerificationStatus: 'verified',
      referenceIntegrityVerificationStatus: 'verified',
      createdAt: '2025-01-07T08:00:00Z',
      updatedAt: '2025-01-06T10:00:00Z',
      createdBy: 'USER-12345',
    });

    // retrieveModificationHistoryByTargetRecord stub - 既存の修正履歴を返す
    mockModificationTracking.retrieveModificationHistoryByTargetRecord.mockResolvedValue({
      modificationRecords: [
        {
          modificationRecordId: 'MOD-20250106-001',
          modificationDateTime: new Date('2025-01-06T10:00:00Z'),
          modificationDetails: [
            {
              fieldName: 'reissueCount',
              previousValue: '0',
              newValue: '1',
            },
          ],
          modificationReason: '初回発行',
          modifierUserId: 'USER-12345',
        },
      ],
      totalCount: 1,
    });

    // recordModificationWithHistory stub - 修正履歴IDを返す
    mockModificationTracking.recordModificationWithHistory.mockResolvedValue({
      modificationRecordId: 'MOD-20250107-002',
      invoiceId: 'INV-20250107-001',
      modificationDateTime: new Date('2025-01-07T14:30:00Z'),
      modificationCount: 1,
      status: 'success',
    });

    // saveInvoice stub - 保存に失敗して例外をスロー
    mockDataPersistence.saveInvoice.mockRejectedValue(
      new Error('請求書の更新に失敗しました'),
    );
  });

  it('InvoiceUpdateFailed エラーが発生し、出力型は返されない', async () => {
    const input: ReissueInvoiceInput = {
      invoiceId: 'INV-20250107-001',
      reissueReason: '顧客への再送付',
      currentDateTime: new Date('2025-01-07T14:30:00Z'),
      executingUserId: 'USER-12345',
    };

    // reissueInvoice 関数が InvoiceUpdateFailed エラーをスロー
    await expect(reissueInvoice(input)).rejects.toThrow(InvoiceUpdateFailed);

    // エラーメッセージの確認
    await expect(reissueInvoice(input)).rejects.toThrow(/請求書の更新に失敗しました。システム管理者に連絡してください。/);

    // fetchInvoiceById が呼ばれたことを確認
    expect(mockDataPersistence.fetchInvoiceById).toHaveBeenCalledWith({
      invoiceId: 'INV-20250107-001',
    });

    // retrieveModificationHistoryByTargetRecord が呼ばれたことを確認
    expect(mockModificationTracking.retrieveModificationHistoryByTargetRecord).toHaveBeenCalled();

    // recordModificationWithHistory が呼ばれたことを確認
    expect(mockModificationTracking.recordModificationWithHistory).toHaveBeenCalled();

    // saveInvoice が呼ばれて失敗したことを確認
    expect(mockDataPersistence.saveInvoice).toHaveBeenCalled();
  });
});
