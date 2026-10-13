import { detectDiscrepancies, LegacyInvoiceDataMissing } from "../../src/logic/discrepancy-detection-engine";
import * as toleranceCriteriaModule from "../../src/logic/discrepancy-tolerance-criteria";

jest.mock("../../src/logic/discrepancy-tolerance-criteria");

describe("SCEN-046: 旧システムのレコード件数が0件のとき、エラーで throw される", () => {
  let mockGetToleranceCriteria: jest.Mock;

  beforeEach(() => {
    mockGetToleranceCriteria =
      toleranceCriteriaModule.getToleranceCriteriaByDiscrepancyType as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should throw LegacyInvoiceDataMissing error when legacy invoice data is empty", async () => {
    const legacyInvoices: Array<{
      invoiceId: string;
      invoiceNumber: string;
      invoiceDate: string;
      invoiceAmount: number;
      taxAmount: number;
      status: string;
      paymentDueDate: string;
    }> = [];

    const newSystemInvoices = [
      {
        invoiceId: "INV-001",
        invoiceNumber: "2025-001",
        invoiceDate: "2025-01-15",
        invoiceAmount: 100000,
        taxAmount: 10000,
        status: "未請求",
        paymentDueDate: "2025-02-15",
      },
    ];

    const legacySalesData = [
      {
        salesId: "SALES-001",
        recordCount: 0,
        totalAmount: 0,
        status: "完了",
      },
    ];

    const newSystemSalesData = [
      {
        salesId: "SALES-001",
        recordCount: 1,
        totalAmount: 100000,
        status: "完了",
      },
    ];

    const detectionTimestamp = "2025-01-20T10:00:00Z";

    mockGetToleranceCriteria.mockResolvedValue({
      AMOUNT_DIFFERENCE: { tolerance: 1000 },
      RECORD_COUNT_MISMATCH: { tolerance: 1 },
      STATUS_INCONSISTENCY: { tolerance: 0 },
    });

    // Should throw LegacyInvoiceDataMissing error
    await expect(
      detectDiscrepancies({
        legacyInvoices,
        newSystemInvoices,
        legacySalesData,
        newSystemSalesData,
        detectionTimestamp,
      })
    ).rejects.toThrow(LegacyInvoiceDataMissing);

    // Verify the error message matches the business rule
    try {
      await detectDiscrepancies({
        legacyInvoices,
        newSystemInvoices,
        legacySalesData,
        newSystemSalesData,
        detectionTimestamp,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(LegacyInvoiceDataMissing);
      const errorMessage = (error as Error).message;
      expect(errorMessage).toContain("旧システム請求書データが取得できていません");
    }
  });
});
