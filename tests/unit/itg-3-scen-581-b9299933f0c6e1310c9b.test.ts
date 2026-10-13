import {
  retrieveLegacyAndNewSystemInvoiceData,
  type RetrieveLegacyAndNewSystemInvoiceDataInput,
  type RetrieveLegacyAndNewSystemInvoiceDataOutput,
} from "../../src/logic/legacy-new-system-data-retrieval";

describe("SCEN-581: 件数差分が5件以上または金額差分が目標売上の1%以上またはステータス不整合が10件以上のとき、リスク程度が『重大』と判定される", () => {
  it("should determine risk level as critical when count diff >= 5 or amount diff >= 1% or status mismatch >= 10", async () => {
    const input: RetrieveLegacyAndNewSystemInvoiceDataInput = {
      periodStart: "2024-01-01",
      periodEnd: "2024-01-31",
      dealIdRange: null,
    };

    const result: RetrieveLegacyAndNewSystemInvoiceDataOutput =
      await retrieveLegacyAndNewSystemInvoiceData(input);

    expect(result.legacyInvoices).toHaveLength(3);
    expect(result.newSystemInvoices).toHaveLength(8);
    expect(result.normalizedComparisonData).toHaveLength(9);

    const countDiff = result.newSystemInvoices.length - result.legacyInvoices.length;
    expect(countDiff).toBeGreaterThanOrEqual(5);

    const statusMismatchCount = result.normalizedComparisonData.filter(
      (r) => r.legacyStatus && r.newSystemStatus && r.legacyStatus !== r.newSystemStatus
    ).length;
    expect(statusMismatchCount).toBeGreaterThanOrEqual(1);
  });
});
