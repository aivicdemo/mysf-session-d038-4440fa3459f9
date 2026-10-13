import {
  retrieveLegacyAndNewSystemSalesData,
  type RetrieveLegacyAndNewSystemSalesDataInput,
} from "../../src/logic/legacy-new-system-data-retrieval";

describe("SCEN-270: 指定期間・商談範囲内の旧新システム営業データを正常に取得し、統合・整理した照合対象データを返却する", () => {
  it("should retrieve and normalize sales data for the specified period and deal range", async () => {
    const input: RetrieveLegacyAndNewSystemSalesDataInput = {
      periodStart: "2024-01-01",
      periodEnd: "2024-01-31",
      dealIdRange: {
        startDealId: "DEAL-001",
        endDealId: "DEAL-100",
      },
    };

    const result = await retrieveLegacyAndNewSystemSalesData(input);

    expect(result.legacySalesRecords).toHaveLength(2);
    expect(result.legacySalesRecords[0]).toMatchObject({
      totalAmount: 5000000,
      status: "Closed Won",
      recordDate: "2024-01-15",
    });
    expect(result.legacySalesRecords[1]).toMatchObject({
      totalAmount: 3000000,
      status: "In Progress",
      recordDate: "2024-01-20",
    });

    expect(result.newSystemSalesRecords).toHaveLength(2);
    expect(result.newSystemSalesRecords[0]).toMatchObject({
      totalAmount: 5000000,
      status: "Closed Won",
      recordDate: "2024-01-15",
    });
    expect(result.newSystemSalesRecords[1]).toMatchObject({
      totalAmount: 3000000,
      status: "In Progress",
      recordDate: "2024-01-20",
    });

    expect(result.normalizedComparisonData).toHaveLength(2);
    expect(result.normalizedComparisonData[0]).toMatchObject({
      recordDate: "2024-01-15",
      legacyRecord: {
        amount: 5000000,
        status: "Closed Won",
      },
      newSystemRecord: {
        amount: 5000000,
        status: "Closed Won",
      },
    });
    expect(result.normalizedComparisonData[1]).toMatchObject({
      recordDate: "2024-01-20",
      legacyRecord: {
        amount: 3000000,
        status: "In Progress",
      },
      newSystemRecord: {
        amount: 3000000,
        status: "In Progress",
      },
    });

    expect(result.extractionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
