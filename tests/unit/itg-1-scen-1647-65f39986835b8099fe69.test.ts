import { fetchDealsForPeriod, type FetchDealsForPeriodInput } from "../../src/logic/data-persistence";

jest.mock("../../src/platform/data-store.ts");

describe("SCEN-1647: 顧客送付が目標日数以内の場合、送付SLAが達成と判定される", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return deals with invoice SLA achieved flag false when within target days", async () => {
    const mockStore = require("../../src/platform/data-store.ts");

    const dealData = [
      {
        id: "deal-001",
        customerId: "cust-001",
        salesRepresentativeId: "sales-001",
        dealName: "A社向け提案",
        dealAmount: 500000,
        stageId: "成約",
        expectedContractDate: "2026-01-15T00:00:00Z",
        description: "テスト商談",
        contractedDate: "2026-01-10T09:30:00Z",
        lossReason: null,
        createdAt: "2026-01-05T10:00:00Z",
        updatedAt: "2026-01-10T09:30:00Z",
        createdBy: "user-001",
        invoiceGenerationSLADeadline: "2026-01-17T23:59:59Z",
        invoiceSLAExceededFlag: false,
      },
      {
        id: "deal-002",
        customerId: "cust-002",
        salesRepresentativeId: "sales-002",
        dealName: "B社向け提案",
        dealAmount: 300000,
        stageId: "成約",
        expectedContractDate: "2026-01-20T00:00:00Z",
        description: "テスト商談2",
        contractedDate: "2026-01-18T14:15:00Z",
        lossReason: null,
        createdAt: "2026-01-08T11:00:00Z",
        updatedAt: "2026-01-18T14:15:00Z",
        createdBy: "user-002",
        invoiceGenerationSLADeadline: "2026-01-21T23:59:59Z",
        invoiceSLAExceededFlag: false,
      },
    ];

    mockStore.listRecords.mockResolvedValue(dealData);

    const input: FetchDealsForPeriodInput = {
      periodStartDateTime: "2026-01-05T00:00:00Z",
      periodEndDateTime: "2026-01-31T23:59:59Z",
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
    expect(result.deals.every((d) => d.invoiceSLAExceededFlag === false)).toBe(true);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
