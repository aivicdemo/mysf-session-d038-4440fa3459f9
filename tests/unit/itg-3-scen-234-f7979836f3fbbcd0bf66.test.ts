import { retrieveDiscrepanciesForCSVExport } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-234: 差異IDが1件のみ指定された場合、その差異に対応するすべての関連データを取得して返す', () => {
  const discrepancyIds = ['550e8400-e29b-41d4-a716-446655440000'];
  const discrepancyRecord = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
    legacySystemInvoiceId: 'OLD-INV-2024-001',
    newSystemInvoiceId: 'NEW-INV-2024-001',
    discrepancyType: '金額差異',
    discrepancyContent: '請求金額の計算誤り',
    amountDifference: 10000,
    countDifference: 0,
    statusDifference: null,
    detectionDateTime: '2024-01-15T10:30:00Z',
    severity: '高',
    causeClassification: '計算エラー',
    toleranceJudgment: '範囲外',
    toleranceJudgmentDateTime: '2024-01-15T11:00:00Z',
    judgedByUserId: '550e8400-e29b-41d4-a716-446655440001',
  };
  const legacyInvoice = {
    id: 'OLD-INV-2024-001',
    invoiceId: 'OLD-INV-2024-001',
    invoiceNumber: 'INV-2024-0001',
    invoiceDate: '2024-01-10T00:00:00Z',
    invoiceAmount: 1000000,
    taxAmount: 100000,
    status: '発行済み',
    paymentDueDate: '2024-02-10T00:00:00Z',
    remarks: '2024年1月分サービス費用',
  };
  const newInvoice = {
    id: 'NEW-INV-2024-001',
    invoiceId: 'NEW-INV-2024-001',
    invoiceNumber: 'INV-2024-0001',
    invoiceDate: '2024-01-10T00:00:00Z',
    invoiceAmount: 990000,
    taxAmount: 99000,
    status: '発行済み',
    paymentDueDate: '2024-02-10T00:00:00Z',
    remarks: '2024年1月分サービス費用',
  };
  const correctionRecord = {
    id: 'CORR-550e8400-e29b-41d4-a716-446655440000',
    correctionId: 'CORR-550e8400-e29b-41d4-a716-446655440000',
    differenceId: '550e8400-e29b-41d4-a716-446655440000',
    correctionMethod: '再計算',
    correctionStatus: '完了',
    correctionExecutorUserId: '550e8400-e29b-41d4-a716-446655440002',
    correctionExecutionDateTime: '2024-01-16T14:30:00Z',
    dataBeforeCorrection: '{"請求金額": 1000000}',
    dataAfterCorrection: '{"請求金額": 990000}',
    verificationResult: '正常',
  };
  const confirmationRecord = {
    id: 'CONF-550e8400-e29b-41d4-a716-446655440000-1',
    confirmationId: 'CONF-550e8400-e29b-41d4-a716-446655440000-1',
    discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
    confirmationUserId: '550e8400-e29b-41d4-a716-446655440003',
    confirmationDateTime: '2024-01-16T15:00:00Z',
    confirmationContent: '是正内容を確認し、問題なし',
    judgmentResult: '承認',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('1件の差異IDが指定された場合、すべての関連データが取得されて返される', async () => {
    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce([discrepancyRecord])
      .mockResolvedValueOnce([legacyInvoice])
      .mockResolvedValueOnce([newInvoice])
      .mockResolvedValueOnce([correctionRecord])
      .mockResolvedValueOnce([confirmationRecord]);

    const result = await retrieveDiscrepanciesForCSVExport({ discrepancyIds });

    expect(result.totalCount).toBe(1);
    expect(result.discrepancies).toHaveLength(1);

    const item = result.discrepancies[0];
    expect(item.discrepancyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(item.legacySystemInvoiceId).toBe('OLD-INV-2024-001');
    expect(item.newSystemInvoiceId).toBe('NEW-INV-2024-001');
    expect(item.discrepancyType).toBe('金額差異');
    expect(item.discrepancyContent).toBe('請求金額の計算誤り');
    expect(item.amountDifference).toBe(10000);
    expect(item.detectionDateTime).toBe('2024-01-15T10:30:00Z');
    expect(item.severity).toBe('高');
    expect(item.causeClassification).toBe('計算エラー');
    expect(item.toleranceJudgment).toBe('範囲外');
    expect(item.judgedByUserId).toBe('550e8400-e29b-41d4-a716-446655440001');

    expect(item.legacySystemInvoice).toEqual(
      expect.objectContaining({
        invoiceId: 'OLD-INV-2024-001',
        invoiceAmount: 1000000,
        status: '発行済み',
      })
    );

    expect(item.newSystemInvoice).toEqual(
      expect.objectContaining({
        invoiceId: 'NEW-INV-2024-001',
        invoiceAmount: 990000,
        status: '発行済み',
      })
    );

    expect(item.correctionTrackingHistory).toHaveLength(1);
    expect(item.correctionTrackingHistory[0]).toEqual(
      expect.objectContaining({
        correctionId: 'CORR-550e8400-e29b-41d4-a716-446655440000',
        correctionStatus: '完了',
      })
    );

    expect(item.confirmationHistory).toHaveLength(1);
    expect(item.confirmationHistory[0]).toEqual(
      expect.objectContaining({
        confirmationId: 'CONF-550e8400-e29b-41d4-a716-446655440000-1',
        judgmentResult: '承認',
      })
    );
  });
});
