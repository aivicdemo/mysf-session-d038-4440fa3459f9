import { reissueInvoice, InvoiceNotFound, InvoiceInvalidStatus, InvoiceModificationRecordCreationFailed, InvoiceUpdateFailed } from '../../src/logic/invoice-generation-management';
import type { ReissueInvoiceInput, ReissueInvoiceOutput } from '../../src/logic/invoice-generation-management';
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

describe('SCEN-135: 有効な請求書を再発行すると、再発行回数が増加し、最終再発行日時が更新され、修正履歴が記録される', () => {
  let mockDataPersistence: jest.Mocked<typeof dataPersistenceModule>;
  let mockModificationTracking: jest.Mocked<typeof modificationTrackingModule>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDataPersistence = dataPersistenceModule as jest.Mocked<typeof dataPersistenceModule>;
    mockModificationTracking = modificationTrackingModule as jest.Mocked<typeof modificationTrackingModule>;

    // fetchInvoiceById stub - 既存請求書を返す
    mockDataPersistence.fetchInvoiceById.mockResolvedValue({
      invoiceId: 'INV-20250101-001',
      dealId: 'DEAL-001',
      customerId: 'CUST-001',
      salesRepresentativeId: 'SR-001',
      invoiceNumber: '2025-001',
      invoiceDate: '2025-01-01',
      dueDate: '2025-02-01',
      invoiceAmount: 150000,
      taxAmount: 15000,
      untaxedAmount: 135000,
      invoiceStatus: 'issued',
      paidDate: null,
      paidAmount: null,
      remarks: null,
      modificationReason: null,
      reissueCount: 2,
      lastReissuedAt: '2025-01-10T09:15:00Z',
      amountCalculationVerificationStatus: 'verified',
      referenceIntegrityVerificationStatus: 'verified',
      createdAt: '2025-01-01T08:00:00Z',
      updatedAt: '2025-01-10T09:15:00Z',
      createdBy: 'USER-12345',
    });

    // retrieveModificationHistoryByTargetRecord stub - 既存の修正履歴を返す
    mockModificationTracking.retrieveModificationHistoryByTargetRecord.mockResolvedValue({
      modificationRecords: [
        {
          modificationRecordId: 'MOD-20250110-001',
          modificationDateTime: new Date('2025-01-10T09:15:00Z'),
          modificationDetails: [
            {
              fieldName: 'reissueCount',
              previousValue: '1',
              newValue: '2',
            },
          ],
          modificationReason: 'フォーマット修正',
          modifierUserId: 'USER-12345',
        },
      ],
      totalCount: 1,
    });

    // saveInvoice stub - 更新後の請求書を返す（reissueCount=3, lastReissuedAt=新しい日時）
    mockDataPersistence.saveInvoice.mockResolvedValue({
      invoiceId: 'INV-20250101-001',
      dealId: 'DEAL-001',
      customerId: 'CUST-001',
      salesRepresentativeId: 'SR-001',
      invoiceNumber: '2025-001',
      invoiceDate: '2025-01-01',
      dueDate: '2025-02-01',
      invoiceAmount: 150000,
      taxAmount: 15000,
      untaxedAmount: 135000,
      invoiceStatus: 'issued',
      paidDate: null,
      paidAmount: null,
      remarks: null,
      modificationReason: null,
      reissueCount: 3,
      lastReissuedAt: '2025-01-15T10:30:00Z',
      amountCalculationVerificationStatus: 'verified',
      referenceIntegrityVerificationStatus: 'verified',
      createdAt: '2025-01-01T08:00:00Z',
      updatedAt: '2025-01-15T10:30:00Z',
      createdBy: 'USER-12345',
    });

    // recordModificationWithHistory stub - 修正履歴IDを返す
    mockModificationTracking.recordModificationWithHistory.mockResolvedValue({
      modificationRecordId: 'MOD-20250115-002',
      invoiceId: 'INV-20250101-001',
      modificationDateTime: new Date('2025-01-15T10:30:00Z'),
      modificationCount: 1,
      status: 'success',
    });
  });

  it('再発行回数が増加し、最終再発行日時が更新され、修正履歴が記録される', async () => {
    const input: ReissueInvoiceInput = {
      invoiceId: 'INV-20250101-001',
      reissueReason: '顧客への再送付',
      currentDateTime: new Date('2025-01-15T10:30:00Z'),
      executingUserId: 'USER-12345',
    };

    const result = await reissueInvoice(input);

    // fetchInvoiceById が正しい invoiceId で呼ばれたか確認
    expect(mockDataPersistence.fetchInvoiceById).toHaveBeenCalledWith({
      invoiceId: 'INV-20250101-001',
    });

    // retrieveModificationHistoryByTargetRecord が呼ばれたか確認
    expect(mockModificationTracking.retrieveModificationHistoryByTargetRecord).toHaveBeenCalledWith({
      targetTableName: 'invoices',
      targetRecordId: 'INV-20250101-001',
    });

    // saveInvoice が新しい reissueCount=3 と lastReissuedAt で呼ばれたか確認
    expect(mockDataPersistence.saveInvoice).toHaveBeenCalled();
    const saveInvoiceCall = mockDataPersistence.saveInvoice.mock.calls[0][0];
    expect(saveInvoiceCall.reissueCount).toBe(3);
    expect(saveInvoiceCall.lastReissuedAt).toBe('2025-01-15T10:30:00Z');

    // recordModificationWithHistory が正しい入力で呼ばれたか確認
    expect(mockModificationTracking.recordModificationWithHistory).toHaveBeenCalled();
    const recordModificationCall = mockModificationTracking.recordModificationWithHistory.mock.calls[0][0];
    expect(recordModificationCall.invoiceId).toBe('INV-20250101-001');
    expect(recordModificationCall.modificationReason).toBe('顧客への再送付');
    expect(recordModificationCall.modifierUserId).toBe('USER-12345');

    // 戻り値の確認：再発行回数が3に増加、最終再発行日時が更新、modificationRecordId が設定される
    expect(result.invoiceId).toBe('INV-20250101-001');
    expect(result.invoiceNumber).toBe('2025-001');
    expect(result.reissueCount).toBe(3);
    expect(result.lastReissuedAt).toEqual(new Date('2025-01-15T10:30:00Z'));
    expect(result.modificationRecordId).toBe('MOD-20250115-002');
    expect(result.invoiceStatus).toBe('issued');
  });
});
