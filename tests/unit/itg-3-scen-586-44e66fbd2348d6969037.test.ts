import {
  retrieveLegacyAndNewSystemInvoiceData,
  type RetrieveLegacyAndNewSystemInvoiceDataInput,
  type RetrieveLegacyAndNewSystemInvoiceDataOutput,
} from "../../src/logic/legacy-new-system-data-retrieval";

describe("SCEN-586: 差異が許容範囲内のとき、分類が『軽微』と判定され監視が継続される", () => {
  it("should classify as minor and continue monitoring when discrepancy is within tolerance", async () => {
    const input: RetrieveLegacyAndNewSystemInvoiceDataInput = {
      periodStart: "2024-01-01",
      periodEnd: "2024-01-31",
      dealIdRange: null,
    };

    const result: RetrieveLegacyAndNewSystemInvoiceDataOutput =
      await retrieveLegacyAndNewSystemInvoiceData(input);

    expect(result.legacyInvoices).toHaveLength(2);
    expect(result.newSystemInvoices).toHaveLength(2);
    expect(result.normalizedComparisonData).toHaveLength(2);

    const minorVarianceRecord = result.normalizedComparisonData.find(
      (r) => r.dealId === "DEAL-001"
    );
    expect(minorVarianceRecord).toBeDefined();
    expect(minorVarianceRecord?.amountDifference).toBe(1000);

    const matchedRecord = result.normalizedComparisonData.find(
      (r) => r.dealId === "DEAL-002"
    );
    expect(matchedRecord).toBeDefined();
    expect(matchedRecord?.amountDifference).toBe(0);

    const timestamp = new Date(result.extractionTimestamp);
    expect(timestamp).toBeInstanceOf(Date);
  });
});
