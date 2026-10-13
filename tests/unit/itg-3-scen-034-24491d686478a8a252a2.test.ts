import { detectDiscrepancies } from '../../src/logic/discrepancy-detection-engine';
import * as discrepancyToleranceCriteria from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/discrepancy-tolerance-criteria', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-tolerance-criteria')>('../../src/logic/discrepancy-tolerance-criteria'),
  getToleranceCriteriaByDiscrepancyType: jest.fn(),
}));

describe('SCEN-034: データ抽出時刻が5分以上異なるとき警告が出力される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('データ抽出時刻の差分が5分以上である場合、DATA_EXTRACTION_TIME_SKEW警告が出力される', async () => {
    const legacyInvoices = [
      {
        invoiceId: 'INV001',
        invoiceNumber: '2024-001',
        invoiceDate: '2024-01-15',
        invoiceAmount: 100000,
        taxAmount: 10000,
        status: 'issued',
        paymentDueDate: '2024-02-15',
      },
    ];

    const newSystemInvoices = [
      {
        invoiceId: 'INV001',
        invoiceNumber: '2024-001',
        invoiceDate: '2024-01-15',
        invoiceAmount: 100000,
        taxAmount: 10000,
        status: 'issued',
        paymentDueDate: '2024-02-15',
      },
    ];

    const legacySalesData = [
      {
        salesId: 'SALES001',
        recordCount: 5,
        totalAmount: 500000,
        status: 'closed',
      },
    ];

    const newSystemSalesData = [
      {
        salesId: 'SALES001',
        recordCount: 5,
        totalAmount: 500000,
        status: 'closed',
      },
    ];

    const detectionTimestamp = '2024-01-15T10:00:00Z';

    const toleranceCriteria = {
      AMOUNT_DIFFERENCE: {
        toleranceAmount: 1000,
        severity: 'MEDIUM',
      },
      RECORD_COUNT_MISMATCH: {
        toleranceCount: 2,
        severity: 'HIGH',
      },
      STATUS_INCONSISTENCY: {
        toleranceCount: 1,
        severity: 'HIGH',
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

    // データ抽出時刻の差分が5分以上であることを示す警告が含まれることを確認
    const dataExtractionTimeSkewWarning = result.discrepancies.find(
      (d) => d.causeClassification === 'DATA_EXTRACTION_TIME_SKEW',
    );

    expect(dataExtractionTimeSkewWarning).toBeDefined();
    expect(dataExtractionTimeSkewWarning?.causeClassification).toBe(
      'DATA_EXTRACTION_TIME_SKEW',
    );
    expect(dataExtractionTimeSkewWarning?.detectionTimestamp).toBe(
      '2024-01-15T10:00:00Z',
    );
    expect(dataExtractionTimeSkewWarning?.severity).toBe('MEDIUM');
    expect(dataExtractionTimeSkewWarning?.toleranceJudgment).toBe(
      'WITHIN_TOLERANCE',
    );

    // summaryReportにメッセージが含まれることを確認
    expect(result.summaryReport.detectionSummary).toContain(
      'データ抽出時刻のズレ',
    );
    expect(result.summaryReport.detectionSummary).toContain(
      '信頼性',
    );

    // totalDiscrepancyCount が1以上であることを確認
    expect(result.totalDiscrepancyCount).toBeGreaterThanOrEqual(1);
  });
});
