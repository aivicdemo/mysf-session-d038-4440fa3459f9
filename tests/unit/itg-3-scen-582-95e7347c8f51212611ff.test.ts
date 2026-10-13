import {
  retrieveLegacyAndNewSystemInvoiceData,
  type RetrieveLegacyAndNewSystemInvoiceDataInput,
  type RetrieveLegacyAndNewSystemInvoiceDataOutput,
} from "../../src/logic/legacy-new-system-data-retrieval";

describe("SCEN-582: 件数差分が1～4件または金額差分が0.1～1%未満またはステータス不整合が1～9件のとき、リスク程度が『中程度』と判定される", () => {
  it("should determine risk level as medium when count diff 1-4 or amount diff 0.1-1% or status mismatch 1-9", async () => {
    const input: RetrieveLegacyAndNewSystemInvoiceDataInput = {
      periodStart: "2025-01-01",
      periodEnd: "2025-01-31",
      dealIdRange: null,
    };

    const result: RetrieveLegacyAndNewSystemInvoiceDataOutput =
      await retrieveLegacyAndNewSystemInvoiceData(input);

    expect(result.legacyInvoices).toHaveLength(4);
    expect(result.newSystemInvoices).toHaveLength(5);
    expect(result.normalizedComparisonData).toHaveLength(5);

    const countDiff = result.newSystemInvoices.length - result.legacyInvoices.length;
    expect(countDiff).toBeGreaterThanOrEqual(1);
    expect(countDiff).toBeLessThanOrEqual(4);

    const statusMismatchCount = result.normalizedComparisonData.filter(
      (r) => r.legacyStatus && r.newSystemStatus && r.legacyStatus !== r.newSystemStatus
    ).length;
    expect(statusMismatchCount).toBeGreaterThanOrEqual(1);
    expect(statusMismatchCount).toBeLessThanOrEqual(9);
  });
});
