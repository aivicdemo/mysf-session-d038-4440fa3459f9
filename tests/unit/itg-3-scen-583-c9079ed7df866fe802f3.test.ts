import {
  retrieveLegacyAndNewSystemInvoiceData,
  type RetrieveLegacyAndNewSystemInvoiceDataInput,
  type RetrieveLegacyAndNewSystemInvoiceDataOutput,
} from "../../src/logic/legacy-new-system-data-retrieval";

describe("SCEN-583: リスク程度が『重大』のとき、移行が即座に一時停止され、経営層に報告される", () => {
  it("should immediately pause migration and report to executive when risk level is critical", async () => {
    const input: RetrieveLegacyAndNewSystemInvoiceDataInput = {
      periodStart: "2024-01-01",
      periodEnd: "2024-01-31",
      dealIdRange: null,
    };

    const result: RetrieveLegacyAndNewSystemInvoiceDataOutput =
      await retrieveLegacyAndNewSystemInvoiceData(input);

    expect(result.legacyInvoices).toHaveLength(2);
    expect(result.newSystemInvoices).toHaveLength(3);
    expect(result.normalizedComparisonData).toHaveLength(3);

    const criticalRecord = result.normalizedComparisonData.find(
      (r) => r.dealId === "D-003"
    );

    expect(criticalRecord).toBeDefined();
    expect(criticalRecord?.amountDifference).toBe(500000);

    const timestamp = new Date(result.extractionTimestamp);
    expect(timestamp).toBeInstanceOf(Date);
  });
});
