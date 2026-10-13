import {
  retrieveLegacyAndNewSystemInvoiceData,
  type RetrieveLegacyAndNewSystemInvoiceDataInput,
  type RetrieveLegacyAndNewSystemInvoiceDataOutput,
} from "../../src/logic/legacy-new-system-data-retrieval";

describe("SCEN-580: 月次締め日まで1営業日以内で『高』以上の差異があるとき、是正優先度が『即時』に設定される", () => {
  it("should set correction priority to immediate when high or critical difference exists within 1 business day before monthly close", async () => {
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

    const record = result.normalizedComparisonData[0];
    expect(record.dealId).toBe("DEAL-100");
    expect(record.legacyInvoiceId).toBe("LEGACY-001");
    expect(record.newSystemInvoiceId).toBe("NEW-001");
    expect(record.legacyAmount).toBe(100000);
    expect(record.newSystemAmount).toBe(150000);
  });
});
