import { detectDiscrepancies } from '../../src/logic/discrepancy-detection-engine';
import * as discrepancyTolerance from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/discrepancy-tolerance-criteria', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-tolerance-criteria')>('../../src/logic/discrepancy-tolerance-criteria'),
  getToleranceCriteriaByDiscrepancyType: jest.fn(),
}));

describe('SCEN-039: 差異件数が1000件を超える場合の警告出力', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('差異件数が1001件以上の場合、警告メッセージが出力される', async () => {
    const legacyInvoices = [
      {
        invoiceId: 'INV-001',
        invoiceNumber: '2024-001',
        invoiceDate: '2024-01-01',
        invoiceAmount: 100000,
        taxAmount: 10000,
        status: '未請求',
        paymentDueDate: '2024-02-01',
      },
    ];

    const newSystemInvoices = [
      {
        invoiceId: 'INV-001',
        invoiceNumber: '2024-001',
        invoiceDate: '2024-01-01',
        invoiceAmount: 100000,
        taxAmount: 10000,
        status: '未請求',
        paymentDueDate: '2024-02-01',
      },
    ];

    const legacySalesData = [
      { salesId: 'SALE-001', recordCount: 600, totalAmount: 6000000, status: '完了' },
      { salesId: 'SALE-002', recordCount: 600, totalAmount: 6000000, status: '完了' },
      { salesId: 'SALE-003', recordCount: 600, totalAmount: 6000000, status: '完了' },
      { salesId: 'SALE-004', recordCount: 600, totalAmount: 6000000, status: '完了' },
    ];

    const newSystemSalesData = [
      { salesId: 'SALE-001', recordCount: 500, totalAmount: 5900000, status: '完了' },
      { salesId: 'SALE-002', recordCount: 520, totalAmount: 5950000, status: '完了' },
      { salesId: 'SALE-003', recordCount: 510, totalAmount: 5920000, status: '完了' },
      { salesId: 'SALE-004', recordCount: 530, totalAmount: 5980000, status: '完了' },
    ];

    const toleranceCriteria = {
      AMOUNT_DIFFERENCE: {
        toleranceAmount: 50000,
        tolerancePercentage: 5,
      },
      RECORD_COUNT_MISMATCH: {
        toleranceCount: 10,
        tolerancePercentage: 2,
      },
      STATUS_INCONSISTENCY: {
        tolerableStatusPairs: [
          ['未請求', '請求予定'],
          ['請求済', '入金待ち'],
        ],
      },
    };

    (discrepancyTolerance.getToleranceCriteriaByDiscrepancyType as jest.Mock).mockResolvedValue(
      toleranceCriteria
    );

    const result = await detectDiscrepancies({
      legacyInvoices,
      newSystemInvoices,
      legacySalesData,
      newSystemSalesData,
      detectionTimestamp: '2024-10-07T10:00:00.000Z',
    });

    expect(result.totalDiscrepancyCount).toBeGreaterThanOrEqual(1001);

    const detectionSummary = result.summaryReport.detectionSummary;
    expect(detectionSummary).toContain('差異件数が多数です');
    expect(detectionSummary).toContain('パフォーマンスに影響する可能性があります');
    expect(detectionSummary).toContain('期間を絞って再実行してください');

    result.discrepancies.forEach((discrepancy) => {
      expect(['AMOUNT_DIFFERENCE', 'RECORD_COUNT_MISMATCH', 'STATUS_INCONSISTENCY']).toContain(
        discrepancy.discrepancyType
      );
      expect(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).toContain(discrepancy.severity);
      expect(['WITHIN_TOLERANCE', 'EXCEEDS_TOLERANCE']).toContain(
        discrepancy.toleranceJudgment
      );
    });
  });
});
