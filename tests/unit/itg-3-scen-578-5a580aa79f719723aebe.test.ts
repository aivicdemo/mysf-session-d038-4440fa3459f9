import {
  retrieveLegacyAndNewSystemInvoiceData,
  type RetrieveLegacyAndNewSystemInvoiceDataInput,
  type RetrieveLegacyAndNewSystemInvoiceDataOutput,
} from "../../src/logic/legacy-new-system-data-retrieval";

describe("SCEN-578: 差異の重大度が『中』のとき、推奨SLAが8時間以内に設定される", () => {
  it("should set recommended SLA to 8 hours when difference severity is medium", async () => {
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

    const mediumSeverityRecord = result.normalizedComparisonData.find(
      (r) => r.dealId === "DEAL-100"
    );

    expect(mediumSeverityRecord).toBeDefined();
    expect(mediumSeverityRecord?.legacyAmount).toBe(100000);
    expect(mediumSeverityRecord?.newSystemAmount).toBe(105000);
    expect(mediumSeverityRecord?.amountDifference).toBe(5000);

    const noVarianceRecord = result.normalizedComparisonData.find(
      (r) => r.dealId === "DEAL-101"
    );
    expect(noVarianceRecord?.amountDifference).toBe(0);
  });
});
