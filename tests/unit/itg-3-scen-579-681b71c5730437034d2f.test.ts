import {
  retrieveLegacyAndNewSystemInvoiceData,
  type RetrieveLegacyAndNewSystemInvoiceDataInput,
  type RetrieveLegacyAndNewSystemInvoiceDataOutput,
} from "../../src/logic/legacy-new-system-data-retrieval";

describe("SCEN-579: 差異の重大度が『低』のとき、推奨SLAが24時間以内に設定される", () => {
  it("should set recommended SLA to 24 hours when difference severity is low", async () => {
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

    const lowSeverityRecord = result.normalizedComparisonData[0];
    expect(lowSeverityRecord.dealId).toBe("DEAL-001");
    expect(lowSeverityRecord.legacyAmount).toBe(100000);
    expect(lowSeverityRecord.newSystemAmount).toBe(105000);
    expect(lowSeverityRecord.amountDifference).toBe(5000);

    const timestamp = new Date(result.extractionTimestamp);
    expect(timestamp).toBeInstanceOf(Date);
  });
});
