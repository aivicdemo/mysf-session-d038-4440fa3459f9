import { retrieveDiscrepanciesForCSVExport, DataStoreAccessError } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-232: 差異確認履歴テーブルへのアクセスに失敗した場合、DataStoreAccessErrorエラーを発生させる', () => {
  const discrepancyIds = ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'];
  const discrepancyRecords = [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      legacySystemInvoiceId: 'OLD-INV-001',
      newSystemInvoiceId: 'NEW-INV-001',
      discrepancyType: '金額差異',
      discrepancyContent: '請求金額に1000円の差異を検出',
      amountDifference: 1000,
      countDifference: 0,
      statusDifference: null,
      detectionDateTime: '2025-01-15T09:30:00Z',
      severity: 'HIGH',
      causeClassification: '消費税計算誤り',
      toleranceJudgment: 'OUT_OF_RANGE',
      toleranceJudgmentDateTime: '2025-01-15T10:00:00Z',
      judgedByUserId: '550e8400-e29b-41d4-a716-446655440099',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      discrepancyId: '550e8400-e29b-41d4-a716-446655440001',
      legacySystemInvoiceId: 'OLD-INV-002',
      newSystemInvoiceId: 'NEW-INV-002',
      discrepancyType: '件数差異',
      discrepancyContent: '請求明細件数が3件異なる',
      amountDifference: 0,
      countDifference: 3,
      statusDifference: null,
      detectionDateTime: '2025-01-15T09:45:00Z',
      severity: 'MEDIUM',
      causeClassification: 'データ抽出漏れ',
      toleranceJudgment: 'OUT_OF_RANGE',
      toleranceJudgmentDateTime: '2025-01-15T10:15:00Z',
      judgedByUserId: '550e8400-e29b-41d4-a716-446655440099',
    },
  ];
  const legacyInvoices = [
    {
      id: 'OLD-INV-001',
      invoiceId: 'OLD-INV-001',
      invoiceNumber: 'INV-2025-0001',
      invoiceDate: '2025-01-10T00:00:00Z',
      invoiceAmount: 100000,
      taxAmount: 10000,
      status: '未払い',
      paymentDueDate: '2025-02-10T00:00:00Z',
      remarks: '1月分サービス料',
    },
    {
      id: 'OLD-INV-002',
      invoiceId: 'OLD-INV-002',
      invoiceNumber: 'INV-2025-0002',
      invoiceDate: '2025-01-10T00:00:00Z',
      invoiceAmount: 250000,
      taxAmount: 25000,
      status: '未払い',
      paymentDueDate: '2025-02-10T00:00:00Z',
      remarks: 'コンサルティング費用',
    },
  ];
  const newInvoices = [
    {
      id: 'NEW-INV-001',
      invoiceId: 'NEW-INV-001',
      invoiceNumber: 'INV-2025-0001',
      invoiceDate: '2025-01-10T00:00:00Z',
      invoiceAmount: 101000,
      taxAmount: 10100,
      status: '未払い',
      paymentDueDate: '2025-02-10T00:00:00Z',
      remarks: '1月分サービス料',
    },
    {
      id: 'NEW-INV-002',
      invoiceId: 'NEW-INV-002',
      invoiceNumber: 'INV-2025-0002',
      invoiceDate: '2025-01-10T00:00:00Z',
      invoiceAmount: 250000,
      taxAmount: 25000,
      status: '未払い',
      paymentDueDate: '2025-02-10T00:00:00Z',
      remarks: 'コンサルティング費用',
    },
  ];
  const correctionRecords = [
    {
      id: '550e8400-e29b-41d4-a716-446655440010',
      correctionId: '550e8400-e29b-41d4-a716-446655440010',
      differenceId: '550e8400-e29b-41d4-a716-446655440000',
      correctionMethod: '手動修正',
      correctionStatus: '実行済み',
      correctionExecutorUserId: '550e8400-e29b-41d4-a716-446655440098',
      correctionExecutionDateTime: '2025-01-15T14:00:00Z',
      dataBeforeCorrection: '{"金額": 100000}',
      dataAfterCorrection: '{"金額": 101000}',
      verificationResult: '成功',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440011',
      correctionId: '550e8400-e29b-41d4-a716-446655440011',
      differenceId: '550e8400-e29b-41d4-a716-446655440001',
      correctionMethod: 'データ再抽出',
      correctionStatus: '未実行',
      correctionExecutorUserId: null,
      correctionExecutionDateTime: null,
      dataBeforeCorrection: null,
      dataAfterCorrection: null,
      verificationResult: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('差異確認履歴テーブルアクセスが DataStoreError で失敗した場合、DataStoreAccessError エラーを返す', async () => {
    const error = new dataStore.DataStoreError('Database connection failed');

    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce(discrepancyRecords)
      .mockResolvedValueOnce(legacyInvoices)
      .mockResolvedValueOnce(newInvoices)
      .mockResolvedValueOnce(correctionRecords)
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
