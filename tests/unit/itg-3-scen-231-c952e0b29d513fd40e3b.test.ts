import { retrieveDiscrepanciesForCSVExport, DataStoreAccessError } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-231: 是正追跡管理テーブルへのアクセスに失敗した場合、DataStoreAccessErrorエラーを発生させる', () => {
  const discrepancyIds = ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'];
  const discrepancyRecords = [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      legacySystemInvoiceId: 'OLD-INV-001',
      newSystemInvoiceId: 'NEW-INV-001',
      discrepancyType: '金額差異',
      discrepancyContent: '請求金額が異なる',
      amountDifference: 10000,
      countDifference: 0,
      statusDifference: null,
      detectionDateTime: '2025-01-15T10:30:00Z',
      severity: '高',
      causeClassification: '税計算誤り',
      toleranceJudgment: '範囲外',
      toleranceJudgmentDateTime: '2025-01-15T11:00:00Z',
      judgedByUserId: 'user-uuid-001',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      discrepancyId: '550e8400-e29b-41d4-a716-446655440001',
      legacySystemInvoiceId: 'OLD-INV-002',
      newSystemInvoiceId: 'NEW-INV-002',
      discrepancyType: '件数差異',
      discrepancyContent: '請求明細の件数が異なる',
      amountDifference: 0,
      countDifference: 2,
      statusDifference: null,
      detectionDateTime: '2025-01-15T10:35:00Z',
      severity: '中',
      causeClassification: '明細データ欠落',
      toleranceJudgment: '範囲外',
      toleranceJudgmentDateTime: '2025-01-15T11:05:00Z',
      judgedByUserId: 'user-uuid-002',
    },
  ];
  const legacyInvoices = [
    {
      id: 'OLD-INV-001',
      invoiceId: 'OLD-INV-001',
      invoiceNumber: 'OLD-2025-001',
      invoiceDate: '2025-01-10T00:00:00Z',
      invoiceAmount: 1000000,
      taxAmount: 100000,
      status: '確定',
      paymentDueDate: '2025-02-10T00:00:00Z',
      remarks: '2025年1月分請求',
    },
    {
      id: 'OLD-INV-002',
      invoiceId: 'OLD-INV-002',
      invoiceNumber: 'OLD-2025-002',
      invoiceDate: '2025-01-12T00:00:00Z',
      invoiceAmount: 500000,
      taxAmount: 50000,
      status: '確定',
      paymentDueDate: '2025-02-12T00:00:00Z',
      remarks: '2025年1月分請求',
    },
  ];
  const newInvoices = [
    {
      id: 'NEW-INV-001',
      invoiceId: 'NEW-INV-001',
      invoiceNumber: 'NEW-2025-001',
      invoiceDate: '2025-01-10T00:00:00Z',
      invoiceAmount: 1010000,
      taxAmount: 101000,
      status: '確定',
      paymentDueDate: '2025-02-10T00:00:00Z',
      remarks: '2025年1月分請求',
    },
    {
      id: 'NEW-INV-002',
      invoiceId: 'NEW-INV-002',
      invoiceNumber: 'NEW-2025-002',
      invoiceDate: '2025-01-12T00:00:00Z',
      invoiceAmount: 500000,
      taxAmount: 50000,
      status: '確定',
      paymentDueDate: '2025-02-12T00:00:00Z',
      remarks: '2025年1月分請求',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('是正追跡管理テーブルアクセスが DataStoreError で失敗した場合、DataStoreAccessError エラーを返す', async () => {
    const error = new dataStore.DataStoreError('Database connection failed');

    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce(discrepancyRecords)
      .mockResolvedValueOnce(legacyInvoices)
      .mockResolvedValueOnce(newInvoices)
      .mockRejectedValueOnce(error);

    await expect(
      retrieveDiscrepanciesForCSVExport({ discrepancyIds })
    ).rejects.toThrow(DataStoreAccessError);

    try {
      await retrieveDiscrepanciesForCSVExport({ discrepancyIds });
    } catch (err) {
      if (err instanceof Error) {
        expect(err.message).toBe('データベースアクセスエラーが発生しました。');
      }
    }
  });
});
