import { retrieveDiscrepanciesForCSVExport } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-236: 複数の差異IDが指定され、一部の差異に差異確認履歴レコードが存在しない場合でも、存在する差異データは返す', () => {
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
      amountDifference: 10000,
      countDifference: 0,
      statusDifference: null,
      detectionDateTime: '2026-01-15T10:00:00Z',
      severity: 'high',
      causeClassification: 'system_error',
      toleranceJudgment: 'out_of_range',
      toleranceJudgmentDateTime: '2026-01-15T10:30:00Z',
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
      statusDifference: 'issued->sent',
      detectionDateTime: '2026-01-15T11:00:00Z',
      severity: 'medium',
      causeClassification: 'data_sync_delay',
      toleranceJudgment: 'within_range',
      toleranceJudgmentDateTime: '2026-01-15T11:30:00Z',
      judgedByUserId: '550e8400-e29b-41d4-a716-446655440099',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      discrepancyId: '550e8400-e29b-41d4-a716-446655440003',
      legacySystemInvoiceId: 'OLD-INV-003',
      newSystemInvoiceId: 'NEW-INV-003',
      discrepancyType: '件数差異',
      discrepancyContent: '請求明細件数が異なる',
      amountDifference: 0,
      countDifference: 2,
      statusDifference: null,
      detectionDateTime: '2026-01-15T12:00:00Z',
      severity: 'high',
      causeClassification: 'missing_data',
      toleranceJudgment: 'out_of_range',
      toleranceJudgmentDateTime: '2026-01-15T12:30:00Z',
      judgedByUserId: '550e8400-e29b-41d4-a716-446655440099',
    },
  ];
  const legacyInvoices = [
    {
      id: 'OLD-INV-001',
      invoiceId: 'OLD-INV-001',
      invoiceNumber: 'INV-2026-0001',
      invoiceDate: '2026-01-10T00:00:00Z',
      invoiceAmount: 100000,
      taxAmount: 10000,
      status: 'issued',
      paymentDueDate: '2026-02-10T00:00:00Z',
      remarks: 'January service charge',
    },
    {
      id: 'OLD-INV-002',
      invoiceId: 'OLD-INV-002',
      invoiceNumber: 'INV-2026-0002',
      invoiceDate: '2026-01-11T00:00:00Z',
      invoiceAmount: 50000,
      taxAmount: 5000,
      status: 'issued',
      paymentDueDate: '2026-02-11T00:00:00Z',
      remarks: 'Subscription renewal',
    },
    {
      id: 'OLD-INV-003',
      invoiceId: 'OLD-INV-003',
      invoiceNumber: 'INV-2026-0003',
      invoiceDate: '2026-01-12T00:00:00Z',
      invoiceAmount: 75000,
      taxAmount: 7500,
      status: 'issued',
      paymentDueDate: '2026-02-12T00:00:00Z',
      remarks: 'Service adjustment',
    },
  ];
  const newInvoices = [
    {
      id: 'NEW-INV-001',
      invoiceId: 'NEW-INV-001',
      invoiceNumber: 'INV-2026-0001',
      invoiceDate: '2026-01-10T00:00:00Z',
      invoiceAmount: 110000,
      taxAmount: 11000,
      status: 'issued',
      paymentDueDate: '2026-02-10T00:00:00Z',
      remarks: 'January service charge',
    },
    {
      id: 'NEW-INV-002',
      invoiceId: 'NEW-INV-002',
      invoiceNumber: 'INV-2026-0002',
      invoiceDate: '2026-01-11T00:00:00Z',
      invoiceAmount: 50000,
      taxAmount: 5000,
      status: 'sent',
      paymentDueDate: '2026-02-11T00:00:00Z',
      remarks: 'Subscription renewal',
    },
    {
      id: 'NEW-INV-003',
      invoiceId: 'NEW-INV-003',
      invoiceNumber: 'INV-2026-0003',
      invoiceDate: '2026-01-12T00:00:00Z',
      invoiceAmount: 75000,
      taxAmount: 7500,
      status: 'issued',
      paymentDueDate: '2026-02-12T00:00:00Z',
      remarks: 'Service adjustment',
    },
  ];
  const correctionRecords = [
    {
      id: '550e8400-e29b-41d4-a716-446655440101',
      correctionId: '550e8400-e29b-41d4-a716-446655440101',
      differenceId: '550e8400-e29b-41d4-a716-446655440001',
      correctionMethod: 'manual_adjustment',
      correctionStatus: 'completed',
      correctionExecutorUserId: '550e8400-e29b-41d4-a716-446655440099',
      correctionExecutionDateTime: '2026-01-15T14:00:00Z',
      dataBeforeCorrection: '{"amount": 100000}',
      dataAfterCorrection: '{"amount": 110000}',
      verificationResult: 'matched',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440102',
      correctionId: '550e8400-e29b-41d4-a716-446655440102',
      differenceId: '550e8400-e29b-41d4-a716-446655440002',
      correctionMethod: 'data_sync',
      correctionStatus: 'pending',
      correctionExecutorUserId: null,
      correctionExecutionDateTime: null,
      dataBeforeCorrection: null,
      dataAfterCorrection: null,
      verificationResult: null,
    },
  ];
  const confirmationRecords = [
    {
      id: '550e8400-e29b-41d4-a716-446655440201',
      confirmationId: '550e8400-e29b-41d4-a716-446655440201',
      discrepancyId: '550e8400-e29b-41d4-a716-446655440001',
      confirmationUserId: '550e8400-e29b-41d4-a716-446655440099',
      confirmationDateTime: '2026-01-15T15:00:00Z',
      confirmationContent: 'Confirmed discrepancy due to system error during migration',
      judgmentResult: 'confirmed',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440202',
      confirmationId: '550e8400-e29b-41d4-a716-446655440202',
      discrepancyId: '550e8400-e29b-41d4-a716-446655440002',
      confirmationUserId: '550e8400-e29b-41d4-a716-446655440099',
      confirmationDateTime: '2026-01-15T16:00:00Z',
      confirmationContent: 'Status difference is within expected sync delay window',
      judgmentResult: 'accepted',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('差異確認履歴レコードが存在しない差異でも、他のデータは返される', async () => {
    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce(discrepancyRecords)
      .mockResolvedValueOnce(legacyInvoices)
      .mockResolvedValueOnce(newInvoices)
      .mockResolvedValueOnce(correctionRecords)
      .mockResolvedValueOnce(confirmationRecords);

    const result = await retrieveDiscrepanciesForCSVExport({ discrepancyIds });

    expect(result.totalCount).toBe(3);
    expect(result.discrepancies).toHaveLength(3);

    // 差異ID 001 には確認履歴と是正追跡管理レコードがある
    expect(result.discrepancies[0].discrepancyId).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect(result.discrepancies[0].confirmationHistory).toHaveLength(1);
    expect(result.discrepancies[0].correctionTrackingHistory).toHaveLength(1);

    // 差異ID 002 には確認履歴と是正追跡管理レコードがある
    expect(result.discrepancies[1].discrepancyId).toBe('550e8400-e29b-41d4-a716-446655440002');
    expect(result.discrepancies[1].confirmationHistory).toHaveLength(1);
    expect(result.discrepancies[1].correctionTrackingHistory).toHaveLength(1);

    // 差異ID 003 には確認履歴と是正追跡管理レコードがない
    expect(result.discrepancies[2].discrepancyId).toBe('550e8400-e29b-41d4-a716-446655440003');
    expect(result.discrepancies[2].confirmationHistory).toHaveLength(0);
    expect(result.discrepancies[2].correctionTrackingHistory).toHaveLength(0);

    // すべての差異が正しくデータを含んでいる
    expect(result.discrepancies[0].legacySystemInvoice).toEqual(
      expect.objectContaining({
        invoiceId: 'OLD-INV-001',
      })
    );
    expect(result.discrepancies[1].newSystemInvoice).toEqual(
      expect.objectContaining({
        status: 'sent',
      })
    );
    expect(result.discrepancies[2].countDifference).toBe(2);
  });
});
