import {
  retrieveLegacyAndNewSystemInvoiceData,
  type RetrieveLegacyAndNewSystemInvoiceDataInput,
  type RetrieveLegacyAndNewSystemInvoiceDataOutput,
} from "../../src/logic/legacy-new-system-data-retrieval";

describe("SCEN-577: 差異の重大度が『高』のとき、推奨SLAが4時間以内に設定される", () => {
  it("should set recommended SLA to 4 hours (240 minutes) when difference severity is high", async () => {
    const input: RetrieveLegacyAndNewSystemInvoiceDataInput = {
      periodStart: "2025-01-01",
      periodEnd: "2025-01-31",
      dealIdRange: null,
    };

    const result: RetrieveLegacyAndNewSystemInvoiceDataOutput =
      await retrieveLegacyAndNewSystemInvoiceData(input);

    expect(result.legacyInvoices).toHaveLength(2);
    expect(result.newSystemInvoices).toHaveLength(3);
    expect(result.normalizedComparisonData).toHaveLength(3);

    const highSeverityRecord = result.normalizedComparisonData.find(
      (r) => r.dealId === "DEAL-003" && r.amountDifference === 500000
    );

    expect(highSeverityRecord).toBeDefined();
    expect(highSeverityRecord?.amountDifference).toBe(500000);
  });
});
