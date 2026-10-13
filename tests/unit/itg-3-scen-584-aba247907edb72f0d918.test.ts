import {
  retrieveLegacyAndNewSystemInvoiceData,
  type RetrieveLegacyAndNewSystemInvoiceDataInput,
  type RetrieveLegacyAndNewSystemInvoiceDataOutput,
} from "../../src/logic/legacy-new-system-data-retrieval";

describe("SCEN-584: リスク程度が『中程度』のとき、手作業検証が実施される", () => {
  it("should flag for manual verification when risk level is medium", async () => {
    const input: RetrieveLegacyAndNewSystemInvoiceDataInput = {
      periodStart: "2024-11-01",
      periodEnd: "2024-11-30",
      dealIdRange: null,
    };

    const result: RetrieveLegacyAndNewSystemInvoiceDataOutput =
      await retrieveLegacyAndNewSystemInvoiceData(input);

    expect(result.legacyInvoices).toHaveLength(2);
    expect(result.newSystemInvoices).toHaveLength(2);
    expect(result.normalizedComparisonData).toHaveLength(2);

    const mediumRiskRecord = result.normalizedComparisonData.find(
      (r) => r.dealId === "DEAL-002" && r.amountDifference === 10000
    );

    expect(mediumRiskRecord).toBeDefined();
    expect(mediumRiskRecord?.legacyAmount).toBe(200000);
    expect(mediumRiskRecord?.newSystemAmount).toBe(210000);
  });
});
