import {
  retrieveLegacyAndNewSystemInvoiceData,
  type RetrieveLegacyAndNewSystemInvoiceDataInput,
  type RetrieveLegacyAndNewSystemInvoiceDataOutput,
  type LegacyInvoiceRecord,
  type NormalizedInvoiceComparisonRecord,
} from "../../src/logic/legacy-new-system-data-retrieval";

describe("SCEN-575: 差異の重大度が『高』のとき、営業部システム担当・経理部門にエスカレーションする", () => {
  it("should escalate to sales system manager and accounting department when difference severity is high", async () => {
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

    const highSeverityRecord = result.normalizedComparisonData.find(
      (record) =>
        record.dealId === "DEAL-101" && record.amountDifference === 30000
    );

    expect(highSeverityRecord).toBeDefined();
    expect(highSeverityRecord?.legacyAmount).toBe(250000);
    expect(highSeverityRecord?.newSystemAmount).toBe(280000);
  });
});
