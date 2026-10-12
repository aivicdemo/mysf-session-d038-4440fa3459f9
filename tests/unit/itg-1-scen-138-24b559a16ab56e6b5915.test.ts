import { reissueInvoice, InvoiceModificationRecordCreationFailed } from '../../src/logic/invoice-generation-management';
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

describe('SCEN-138: 修正履歴の記録に失敗したとき、InvoiceModificationRecordCreationFailedエラーが発生する', () => {
  let mockDataPersistence: jest.Mocked<typeof dataPersistenceModule>;
  let mockModificationTracking: jest.Mocked<typeof modificationTrackingModule>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDataPersistence = dataPersistenceModule as jest.Mocked<typeof dataPersistenceModule>;
    mockModificationTracking = modificationTrackingModule as jest.Mocked<typeof modificationTrackingModule>;

    // fetchInvoiceById stub - 有効な請求書を返す（ステータス=issued）
    mockDataPersistence.fetchInvoiceById.mockResolvedValue({
      invoiceId: 'INV-2024-001',
      dealId: 'DEAL-001',
      customerId: 'CUST-001',
      salesRepresentativeId: 'SR-001',
      invoiceNumber: '2024-0001',
      invoiceDate: '2024-01-10',
      dueDate: '2024-02-10',
      invoiceAmount: 100000,
      taxAmount: 10000,
      untaxedAmount: 90000,
      invoiceStatus: 'issued',
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

    // retrieveModificationHistoryByTargetRecord stub - 空の修正履歴を返す
    mockModificationTracking.retrieveModificationHistoryByTargetRecord.mockResolvedValue({
      modificationRecords: [],
      totalCount: 0,
    });

    // saveInvoice stub - 更新後の請求書を返す
    mockDataPersistence.saveInvoice.mockResolvedValue({
      invoiceId: 'INV-2024-001',
      dealId: 'DEAL-001',
      customerId: 'CUST-001',
      salesRepresentativeId: 'SR-001',
      invoiceNumber: '2024-0001',
      invoiceDate: '2024-01-10',
      dueDate: '2024-02-10',
      invoiceAmount: 100000,
      taxAmount: 10000,
      untaxedAmount: 90000,
      invoiceStatus: 'issued',
      paidDate: null,
      paidAmount: null,
      remarks: null,
      modificationReason: null,
      reissueCount: 1,
      lastReissuedAt: '2024-01-15T10:30:00Z',
      amountCalculationVerificationStatus: 'verified',
      referenceIntegrityVerificationStatus: 'verified',
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
      createdBy: 'USER-12345',
    });

    // recordModificationWithHistory stub - 例外をスロー
    mockModificationTracking.recordModificationWithHistory.mockRejectedValue(
      new Error('修正履歴の記録に失敗しました'),
    );
  });

  it('InvoiceModificationRecordCreationFailed エラーが発生する', async () => {
    const input: ReissueInvoiceInput = {
      invoiceId: 'INV-2024-001',
      reissueReason: '顧客への再送付',
      currentDateTime: new Date('2024-01-15T10:30:00Z'),
      executingUserId: 'USER-12345',
    };

    // reissueInvoice 関数が InvoiceModificationRecordCreationFailed エラーをスロー
    await expect(reissueInvoice(input)).rejects.toThrow(InvoiceModificationRecordCreationFailed);

    // エラーメッセージの確認
    await expect(reissueInvoice(input)).rejects.toThrow(/再発行履歴の記録に失敗しました。システム管理者に連絡してください。/);

    // fetchInvoiceById と saveInvoice は呼ばれているが、recordModificationWithHistory が失敗している
    expect(mockDataPersistence.fetchInvoiceById).toHaveBeenCalled();
    expect(mockDataPersistence.saveInvoice).toHaveBeenCalled();
    expect(mockModificationTracking.recordModificationWithHistory).toHaveBeenCalled();
  });
});
