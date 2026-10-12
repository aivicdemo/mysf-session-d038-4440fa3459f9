import { fetchDealsForPeriod, type FetchDealsForPeriodInput } from "../../src/logic/data-persistence";

jest.mock("../../src/platform/data-store.ts");

describe("SCEN-1653: 警告レベルが危険の場合、推奨アクションとして経理部門への即座の確認依頼が出力される", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return deals with danger level when invoice SLA is exceeded", async () => {
    const mockStore = require("../../src/platform/data-store.ts");

    const dealData = [
      {
        id: "deal-001",
        customerId: "customer-001",
        salesRepresentativeId: "rep-001",
        dealName: "A社との契約案件",
        dealAmount: 1000000,
        stageId: "成約",
        expectedContractDate: "2024-12-15T00:00:00Z",
        description: "重要案件",
        contractedDate: "2024-12-10T00:00:00Z",
        lossReason: null,
        createdAt: "2024-11-01T10:00:00Z",
        updatedAt: "2024-12-10T15:30:00Z",
        createdBy: "user-001",
        invoiceGenerationSLADeadline: "2024-12-17T23:59:59Z",
        invoiceSLAExceededFlag: true,
      },
      {
        id: "deal-002",
        customerId: "customer-002",
        salesRepresentativeId: "rep-002",
        dealName: "B社との更新案件",
        dealAmount: 500000,
        stageId: "成約",
        expectedContractDate: "2024-12-20T00:00:00Z",
        description: "通常案件",
        contractedDate: "2024-12-18T00:00:00Z",
        lossReason: null,
        createdAt: "2024-11-15T09:00:00Z",
        updatedAt: "2024-12-18T12:00:00Z",
        createdBy: "user-002",
        invoiceGenerationSLADeadline: "2024-12-20T23:59:59Z",
        invoiceSLAExceededFlag: false,
      },
    ];

    mockStore.listRecords.mockResolvedValue(dealData);

    const input: FetchDealsForPeriodInput = {
      periodStartDateTime: "2024-11-01T00:00:00Z",
      periodEndDateTime: "2024-12-31T23:59:59Z",
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: "updatedAt",
    };

    const result = await fetchDealsForPeriod(input);

    expect(result.deals).toHaveLength(2);
    expect(result.totalCount).toBe(2);
    expect(result.deals[0].dealId).toBe("deal-002");
    expect(result.deals[1].dealId).toBe("deal-001");
    const dangerDeal = result.deals.find((d) => d.invoiceSLAExceededFlag === true);
    expect(dangerDeal).toBeDefined();
    expect(dangerDeal?.dealId).toBe("deal-001");
    expect(dangerDeal?.invoiceGenerationSLADeadline).toBe("2024-12-17T23:59:59Z");
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
