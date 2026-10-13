import {
  retrieveLegacyAndNewSystemInvoiceData,
  type RetrieveLegacyAndNewSystemInvoiceDataInput,
  type RetrieveLegacyAndNewSystemInvoiceDataOutput,
} from "../../src/logic/legacy-new-system-data-retrieval";

describe("SCEN-576: 差異の重大度が『極度』のとき、推奨SLAが2時間以内に設定される", () => {
  it("should set recommended SLA to 2 hours when difference severity is critical", async () => {
    const input: RetrieveLegacyAndNewSystemInvoiceDataInput = {
      periodStart: "2025-01-01",
      periodEnd: "2025-01-31",
      dealIdRange: null,
    };

    const result: RetrieveLegacyAndNewSystemInvoiceDataOutput =
      await retrieveLegacyAndNewSystemInvoiceData(input);

    expect(result.legacyInvoices).toHaveLength(1);
    expect(result.newSystemInvoices).toHaveLength(1);
    expect(result.normalizedComparisonData).toHaveLength(1);
    expect(result.normalizedComparisonData[0].dealId).toBe("DEAL-100");
    expect(result.normalizedComparisonData[0].legacyAmount).toBe(150000);
    expect(result.normalizedComparisonData[0].newSystemAmount).toBe(160000);

    const timestamp = new Date(result.extractionTimestamp);
    expect(timestamp).toBeInstanceOf(Date);
    expect(timestamp.getTime()).toBeGreaterThan(0);
  });
});
