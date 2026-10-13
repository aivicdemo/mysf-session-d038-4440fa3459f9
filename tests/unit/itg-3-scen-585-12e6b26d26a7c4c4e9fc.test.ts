import {
  retrieveLegacyAndNewSystemInvoiceData,
  type RetrieveLegacyAndNewSystemInvoiceDataInput,
  type RetrieveLegacyAndNewSystemInvoiceDataOutput,
} from "../../src/logic/legacy-new-system-data-retrieval";

describe("SCEN-585: リスク程度が『軽微』のとき、継続監視が実施される", () => {
  it("should continue monitoring when risk level is minor", async () => {
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

    result.normalizedComparisonData.forEach((record) => {
      expect(record.legacyAmount).toBeDefined();
      expect(record.newSystemAmount).toBeDefined();
    });

    const timestamp = new Date(result.extractionTimestamp);
    expect(timestamp).toBeInstanceOf(Date);
  });
});
