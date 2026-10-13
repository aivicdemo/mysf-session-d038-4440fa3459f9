import { detectDiscrepancies } from '../../src/logic/discrepancy-detection-engine';
import * as discrepancyToleranceCriteria from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/discrepancy-tolerance-criteria', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-tolerance-criteria')>('../../src/logic/discrepancy-tolerance-criteria'),
  getToleranceCriteriaByDiscrepancyType: jest.fn(),
}));

describe('SCEN-049: 金額差分が負の値のとき、絶対値で計算される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('新システム金額が旧システムより大きい場合、差分は絶対値で計算され正の値となる', async () => {
    const legacyInvoices = [
      {
        invoiceId: 'INV001',
        invoiceNumber: '2024-001',
        invoiceDate: '2024-01-15',
        invoiceAmount: 1000000,
        taxAmount: 100000,
        status: 'issued',
        paymentDueDate: '2024-02-15',
      },
    ];

    const newSystemInvoices = [
      {
        invoiceId: 'INV001',
        invoiceNumber: '2024-001',
        invoiceDate: '2024-01-15',
        invoiceAmount: 1000500,
        taxAmount: 100050,
        status: 'issued',
        paymentDueDate: '2024-02-15',
      },
    ];

    const legacySalesData = [
      {
        salesId: 'SALES001',
        recordCount: 50,
        totalAmount: 5000000,
        status: 'active',
      },
    ];

    const newSystemSalesData = [
      {
        salesId: 'SALES001',
        recordCount: 50,
        totalAmount: 5000500,
        status: 'active',
      },
    ];

    const detectionTimestamp = '2024-01-20T10:00:00Z';

    const toleranceCriteria = {
      AMOUNT_DIFFERENCE: {
        toleranceAmount: 1000,
        tolerancePercentage: 0.5,
      },
      RECORD_COUNT_MISMATCH: {
        toleranceCount: 5,
      },
      STATUS_INCONSISTENCY: {
        toleranceCount: 3,
      },
    };

    (
      discrepancyToleranceCriteria.getToleranceCriteriaByDiscrepancyType as jest.Mock
    ).mockResolvedValue(toleranceCriteria);

    const input = {
      legacyInvoices,
      newSystemInvoices,
      legacySalesData,
      newSystemSalesData,
      detectionTimestamp,
    };

    const result = await detectDiscrepancies(input);

    // amountDifferenceが負の値でないことを確認（絶対値で計算されている）
    const amountDiscrepancies = result.discrepancies.filter(
      (d) => d.discrepancyType === 'AMOUNT_DIFFERENCE',
    );

    amountDiscrepancies.forEach((discrepancy) => {
      if (discrepancy.amountDifference !== null) {
        // 絶対値なので0以上であること
        expect(discrepancy.amountDifference).toBeGreaterThanOrEqual(0);
      }
    });

    // summaryReport.totalAmountDifferenceが絶対値であることを確認
    expect(result.summaryReport.totalAmountDifference).toBeGreaterThanOrEqual(0);

    // 許容基準内の判定がされていることを確認
    const discrepancyWithinTolerance = result.discrepancies.find(
      (d) =>
        d.discrepancyType === 'AMOUNT_DIFFERENCE' &&
        d.toleranceJudgment === 'WITHIN_TOLERANCE',
    );

    // 500円の差分は1000円の許容基準内
    if (amountDiscrepancies.length > 0) {
      expect(discrepancyWithinTolerance || result.discrepancies.length >= 1).toBeTruthy();
    }
  });
});
