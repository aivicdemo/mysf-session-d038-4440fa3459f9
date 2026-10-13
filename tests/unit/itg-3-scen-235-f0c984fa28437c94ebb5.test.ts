import { retrieveDiscrepanciesForCSVExport } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-235: 複数の差異IDが指定され、一部の差異に是正追跡管理レコードが存在しない場合でも、存在する差異データは返す', () => {
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
      discrepancyContent: '請求金額が異なります',
      amountDifference: 5000,
      countDifference: 0,
      statusDifference: null,
      detectionDateTime: '2025-01-15T10:30:00Z',
      severity: '中',
      causeClassification: 'システム移行',
      toleranceJudgment: '超過',
      toleranceJudgmentDateTime: '2025-01-15T11:00:00Z',
      judgedByUserId: '550e8400-e29b-41d4-a716-446655440099',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      discrepancyId: '550e8400-e29b-41d4-a716-446655440002',
      legacySystemInvoiceId: 'OLD-INV-002',
      newSystemInvoiceId: 'NEW-INV-002',
      discrepancyType: 'ステータス差異',
      discrepancyContent: '請求書ステータスが異なります',
      amountDifference: 0,
      countDifference: 0,
      statusDifference: '確定→未確定',
      detectionDateTime: '2025-01-15T10:45:00Z',
      severity: '低',
      causeClassification: '手動修正',
      toleranceJudgment: '超過',
      toleranceJudgmentDateTime: '2025-01-15T11:15:00Z',
      judgedByUserId: '550e8400-e29b-41d4-a716-446655440099',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      discrepancyId: '550e8400-e29b-41d4-a716-446655440003',
      legacySystemInvoiceId: 'OLD-INV-003',
      newSystemInvoiceId: 'NEW-INV-003',
      discrepancyType: '金額差異',
      discrepancyContent: '税金額が異なります',
      amountDifference: 1500,
      countDifference: 0,
      statusDifference: null,
      detectionDateTime: '2025-01-15T11:00:00Z',
      severity: '高',
      causeClassification: 'システム移行',
      toleranceJudgment: '超過',
      toleranceJudgmentDateTime: '2025-01-15T11:30:00Z',
      judgedByUserId: '550e8400-e29b-41d4-a716-446655440099',
    },
  ];
  const legacyInvoices = [
    {
      id: 'OLD-INV-001',
      invoiceId: 'OLD-INV-001',
      invoiceNumber: 'OLD-2025-001',
      invoiceDate: '2025-01-10T00:00:00Z',
      invoiceAmount: 100000,
      taxAmount: 10000,
      status: '確定',
      paymentDueDate: '2025-02-10T00:00:00Z',
      remarks: 'システム移行前の請求書',
    },
    {
      id: 'OLD-INV-002',
      invoiceId: 'OLD-INV-002',
      invoiceNumber: 'OLD-2025-002',
      invoiceDate: '2025-01-11T00:00:00Z',
      invoiceAmount: 250000,
      taxAmount: 25000,
      status: '確定',
      paymentDueDate: '2025-02-11T00:00:00Z',
      remarks: '月次請求',
    },
    {
      id: 'OLD-INV-003',
      invoiceId: 'OLD-INV-003',
      invoiceNumber: 'OLD-2025-003',
      invoiceDate: '2025-01-12T00:00:00Z',
      invoiceAmount: 75000,
      taxAmount: 7500,
      status: '確定',
      paymentDueDate: '2025-02-12T00:00:00Z',
      remarks: '追加請求',
    },
  ];
  const newInvoices = [
    {
      id: 'NEW-INV-001',
      invoiceId: 'NEW-INV-001',
      invoiceNumber: 'NEW-2025-001',
      invoiceDate: '2025-01-10T00:00:00Z',
      invoiceAmount: 105000,
      taxAmount: 10500,
      status: '確定',
      paymentDueDate: '2025-02-10T00:00:00Z',
      remarks: 'システム移行後の請求書',
    },
    {
      id: 'NEW-INV-002',
      invoiceId: 'NEW-INV-002',
      invoiceNumber: 'NEW-2025-002',
      invoiceDate: '2025-01-11T00:00:00Z',
      invoiceAmount: 250000,
      taxAmount: 25000,
      status: '未確定',
      paymentDueDate: '2025-02-11T00:00:00Z',
      remarks: '月次請求',
    },
    {
      id: 'NEW-INV-003',
      invoiceId: 'NEW-INV-003',
      invoiceNumber: 'NEW-2025-003',
      invoiceDate: '2025-01-12T00:00:00Z',
      invoiceAmount: 75000,
      taxAmount: 9000,
      status: '確定',
      paymentDueDate: '2025-02-12T00:00:00Z',
      remarks: '追加請求',
    },
  ];
  const correctionRecords = [
    {
      id: 'COR-001',
      correctionId: 'COR-001',
      differenceId: '550e8400-e29b-41d4-a716-446655440001',
      correctionMethod: '手動修正',
      correctionStatus: '完了',
      correctionExecutorUserId: '550e8400-e29b-41d4-a716-446655440088',
      correctionExecutionDateTime: '2025-01-16T14:00:00Z',
      dataBeforeCorrection: '{"金額差異":5000}',
      dataAfterCorrection: '{"金額差異":0}',
      verificationResult: '成功',
    },
  ];
  const confirmationRecords = [
    {
      id: 'CONF-001',
      confirmationId: 'CONF-001',
      discrepancyId: '550e8400-e29b-41d4-a716-446655440001',
      confirmationUserId: '550e8400-e29b-41d4-a716-446655440077',
      confirmationDateTime: '2025-01-15T15:30:00Z',
      confirmationContent: '金額差異を確認しました',
      judgmentResult: '要対応',
    },
    {
      id: 'CONF-002',
      confirmationId: 'CONF-002',
      discrepancyId: '550e8400-e29b-41d4-a716-446655440002',
      confirmationUserId: '550e8400-e29b-41d4-a716-446655440077',
      confirmationDateTime: '2025-01-15T16:00:00Z',
      confirmationContent: 'ステータス差異を確認しました',
      judgmentResult: '要対応',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('是正追跡管理レコードが存在しない差異でも、他のデータは返される', async () => {
    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce(discrepancyRecords)
      .mockResolvedValueOnce(legacyInvoices)
      .mockResolvedValueOnce(newInvoices)
      .mockResolvedValueOnce(correctionRecords)
      .mockResolvedValueOnce(confirmationRecords);

    const result = await retrieveDiscrepanciesForCSVExport({ discrepancyIds });

    expect(result.totalCount).toBe(3);
    expect(result.discrepancies).toHaveLength(3);

    // 差異ID 001 には是正追跡管理レコードがある
    expect(result.discrepancies[0].discrepancyId).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect(result.discrepancies[0].correctionTrackingHistory).toHaveLength(1);
    expect(result.discrepancies[0].confirmationHistory).toHaveLength(1);

    // 差異ID 002 には是正追跡管理レコードがないが、確認履歴がある
    expect(result.discrepancies[1].discrepancyId).toBe('550e8400-e29b-41d4-a716-446655440002');
    expect(result.discrepancies[1].correctionTrackingHistory).toHaveLength(0);
    expect(result.discrepancies[1].confirmationHistory).toHaveLength(1);

    // 差異ID 003 には是正追跡管理レコードと確認履歴がない
    expect(result.discrepancies[2].discrepancyId).toBe('550e8400-e29b-41d4-a716-446655440003');
    expect(result.discrepancies[2].correctionTrackingHistory).toHaveLength(0);
    expect(result.discrepancies[2].confirmationHistory).toHaveLength(0);

    // すべての差異が正しくデータを含んでいる
    expect(result.discrepancies[0].amountDifference).toBe(5000);
    expect(result.discrepancies[1].statusDifference).toBe('確定→未確定');
    expect(result.discrepancies[2].amountDifference).toBe(1500);
  });
});
