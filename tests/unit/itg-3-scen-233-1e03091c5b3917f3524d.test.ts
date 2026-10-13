import { retrieveDiscrepanciesForCSVExport } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-233: 取得した差異レコードの件数をtotalCountに正確に設定して返す', () => {
  const discrepancyIds = [
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003',
  ];
  const discrepancyRecords = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      discrepancyId: '550e8400-e29b-41d4-a716-446655440001',
      legacySystemInvoiceId: 'OLD-INV-001',
      newSystemInvoiceId: 'NEW-INV-001',
      discrepancyType: '金額差異',
      discrepancyContent: '請求金額が異なる',
      amountDifference: 1000,
      countDifference: 0,
      statusDifference: null,
      detectionDateTime: '2025-01-15T10:30:00Z',
      severity: '高',
      causeClassification: '丸め誤差',
      toleranceJudgment: '範囲外',
      toleranceJudgmentDateTime: '2025-01-15T11:00:00Z',
      judgedByUserId: '550e8400-e29b-41d4-a716-446655440099',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      discrepancyId: '550e8400-e29b-41d4-a716-446655440002',
      legacySystemInvoiceId: 'OLD-INV-002',
      newSystemInvoiceId: 'NEW-INV-002',
      discrepancyType: 'ステータス差異',
      discrepancyContent: '請求ステータスが異なる',
      amountDifference: 0,
      countDifference: 0,
      statusDifference: '未払い→支払済み',
      detectionDateTime: '2025-01-15T10:45:00Z',
      severity: '中',
      causeClassification: 'システム同期遅延',
      toleranceJudgment: '範囲外',
      toleranceJudgmentDateTime: '2025-01-15T11:15:00Z',
      judgedByUserId: '550e8400-e29b-41d4-a716-446655440099',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      discrepancyId: '550e8400-e29b-41d4-a716-446655440003',
      legacySystemInvoiceId: 'OLD-INV-003',
      newSystemInvoiceId: 'NEW-INV-003',
      discrepancyType: '件数差異',
      discrepancyContent: '明細件数が異なる',
      amountDifference: 0,
      countDifference: 2,
      statusDifference: null,
      detectionDateTime: '2025-01-15T11:00:00Z',
      severity: '低',
      causeClassification: 'データ欠落',
      toleranceJudgment: '範囲内',
      toleranceJudgmentDateTime: '2025-01-15T11:30:00Z',
      judgedByUserId: '550e8400-e29b-41d4-a716-446655440099',
    },
  ];
  const legacyInvoices = [
    {
      id: 'OLD-INV-001',
      invoiceId: 'OLD-INV-001',
      invoiceNumber: 'OLD-2025-001',
      invoiceDate: '2025-01-01T00:00:00Z',
      invoiceAmount: 100000,
      taxAmount: 10000,
      status: '未払い',
      paymentDueDate: '2025-02-01T00:00:00Z',
      remarks: '商品A販売',
    },
    {
      id: 'OLD-INV-002',
      invoiceId: 'OLD-INV-002',
      invoiceNumber: 'OLD-2025-002',
      invoiceDate: '2025-01-05T00:00:00Z',
      invoiceAmount: 50000,
      taxAmount: 5000,
      status: '未払い',
      paymentDueDate: '2025-02-05T00:00:00Z',
      remarks: '商品B販売',
    },
    {
      id: 'OLD-INV-003',
      invoiceId: 'OLD-INV-003',
      invoiceNumber: 'OLD-2025-003',
      invoiceDate: '2025-01-10T00:00:00Z',
      invoiceAmount: 75000,
      taxAmount: 7500,
      status: '支払済み',
      paymentDueDate: '2025-02-10T00:00:00Z',
      remarks: '商品C販売',
    },
  ];
  const newInvoices = [
    {
      id: 'NEW-INV-001',
      invoiceId: 'NEW-INV-001',
      invoiceNumber: 'NEW-2025-001',
      invoiceDate: '2025-01-01T00:00:00Z',
      invoiceAmount: 101000,
      taxAmount: 10100,
      status: '未払い',
      paymentDueDate: '2025-02-01T00:00:00Z',
      remarks: '商品A販売',
    },
    {
      id: 'NEW-INV-002',
      invoiceId: 'NEW-INV-002',
      invoiceNumber: 'NEW-2025-002',
      invoiceDate: '2025-01-05T00:00:00Z',
      invoiceAmount: 50000,
      taxAmount: 5000,
      status: '支払済み',
      paymentDueDate: '2025-02-05T00:00:00Z',
      remarks: '商品B販売',
    },
    {
      id: 'NEW-INV-003',
      invoiceId: 'NEW-INV-003',
      invoiceNumber: 'NEW-2025-003',
      invoiceDate: '2025-01-10T00:00:00Z',
      invoiceAmount: 75000,
      taxAmount: 7500,
      status: '支払済み',
      paymentDueDate: '2025-02-10T00:00:00Z',
      remarks: '商品C販売',
    },
  ];
  const correctionRecords = [
    {
      id: '550e8400-e29b-41d4-a716-446655440101',
      correctionId: '550e8400-e29b-41d4-a716-446655440101',
      differenceId: '550e8400-e29b-41d4-a716-446655440001',
      correctionMethod: '金額調整',
      correctionStatus: '完了',
      correctionExecutorUserId: '550e8400-e29b-41d4-a716-446655440050',
      correctionExecutionDateTime: '2025-01-16T09:00:00Z',
      dataBeforeCorrection: '{"amount": 100000}',
      dataAfterCorrection: '{"amount": 101000}',
      verificationResult: '成功',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440102',
      correctionId: '550e8400-e29b-41d4-a716-446655440102',
      differenceId: '550e8400-e29b-41d4-a716-446655440002',
      correctionMethod: 'ステータス更新',
      correctionStatus: '進行中',
      correctionExecutorUserId: '550e8400-e29b-41d4-a716-446655440051',
      correctionExecutionDateTime: '2025-01-16T10:00:00Z',
      dataBeforeCorrection: '{"status": "未払い"}',
      dataAfterCorrection: '{"status": "支払済み"}',
      verificationResult: '未検証',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440103',
      correctionId: '550e8400-e29b-41d4-a716-446655440103',
      differenceId: '550e8400-e29b-41d4-a716-446655440003',
      correctionMethod: 'データ補正',
      correctionStatus: '保留中',
      correctionExecutorUserId: null,
      correctionExecutionDateTime: null,
      dataBeforeCorrection: '{"count": 10}',
      dataAfterCorrection: null,
      verificationResult: '未実行',
    },
  ];
  const confirmationRecords = [
    {
      id: '550e8400-e29b-41d4-a716-446655440201',
      confirmationId: '550e8400-e29b-41d4-a716-446655440201',
      discrepancyId: '550e8400-e29b-41d4-a716-446655440001',
      confirmationUserId: '550e8400-e29b-41d4-a716-446655440070',
      confirmationDateTime: '2025-01-15T14:00:00Z',
      confirmationContent: '金額差異は丸め誤差による',
      judgmentResult: '承認',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440202',
      confirmationId: '550e8400-e29b-41d4-a716-446655440202',
      discrepancyId: '550e8400-e29b-41d4-a716-446655440002',
      confirmationUserId: '550e8400-e29b-41d4-a716-446655440071',
      confirmationDateTime: '2025-01-15T15:30:00Z',
      confirmationContent: 'ステータス同期待機中',
      judgmentResult: '保留',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440203',
      confirmationId: '550e8400-e29b-41d4-a716-446655440203',
      discrepancyId: '550e8400-e29b-41d4-a716-446655440003',
      confirmationUserId: '550e8400-e29b-41d4-a716-446655440072',
      confirmationDateTime: '2025-01-15T16:00:00Z',
      confirmationContent: '許容範囲内として処理',
      judgmentResult: '承認',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('3件の差異IDが指定された場合、totalCount が 3 に設定されて返される', async () => {
    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce(discrepancyRecords)
      .mockResolvedValueOnce(legacyInvoices)
      .mockResolvedValueOnce(newInvoices)
      .mockResolvedValueOnce(correctionRecords)
      .mockResolvedValueOnce(confirmationRecords);

    const result = await retrieveDiscrepanciesForCSVExport({ discrepancyIds });

    expect(result.totalCount).toBe(3);
    expect(result.discrepancies).toHaveLength(3);
    expect(result.totalCount).toBe(result.discrepancies.length);
  });
});
