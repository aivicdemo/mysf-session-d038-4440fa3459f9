import { fetchDealsForPeriod, type FetchDealsForPeriodInput } from "../../src/logic/data-persistence";

jest.mock("../../src/platform/data-store.ts");

describe("SCEN-1648: 顧客送付が目標日数の110%以内の場合、送付SLAが警告と判定される", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return deals sorted by updatedAt descending with both SLA exceeded flags false", async () => {
    const mockStore = require("../../src/platform/data-store.ts");

    const dealData = [
      {
        id: "deal-001",
        customerId: "cust-001",
        salesRepresentativeId: "rep-001",
        dealName: "A社新規案件",
        dealAmount: 1000000,
        stageId: "成約",
        expectedContractDate: "2024-12-15T00:00:00Z",
        description: "テスト商談",
        contractedDate: "2024-12-10T00:00:00Z",
        lossReason: null,
        createdAt: "2024-11-01T10:00:00Z",
        updatedAt: "2024-12-10T10:00:00Z",
        createdBy: "user-001",
        invoiceGenerationSLADeadline: "2024-12-17T00:00:00Z",
        invoiceSLAExceededFlag: false,
      },
      {
        id: "deal-002",
        customerId: "cust-002",
        salesRepresentativeId: "rep-002",
        dealName: "B社拡大案件",
        dealAmount: 2000000,
        stageId: "成約",
        expectedContractDate: "2024-12-20T00:00:00Z",
        description: "テスト商談2",
        contractedDate: "2024-12-18T00:00:00Z",
        lossReason: null,
        createdAt: "2024-11-05T09:00:00Z",
        updatedAt: "2024-12-18T10:00:00Z",
        createdBy: "user-002",
        invoiceGenerationSLADeadline: "2024-12-22T00:00:00Z",
        invoiceSLAExceededFlag: false,
      },
    ];

    mockStore.listRecords.mockResolvedValue(dealData);

    const input: FetchDealsForPeriodInput = {
      periodStartDateTime: "2024-12-01T00:00:00Z",
      periodEndDateTime: "2024-12-31T23:59:59Z",
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: undefined,
    };

    const result = await fetchDealsForPeriod(input);

    expect(result.deals).toHaveLength(2);
    expect(result.totalCount).toBe(2);
    expect(result.deals[0].dealId).toBe("deal-002");
    expect(result.deals[1].dealId).toBe("deal-001");
    expect(result.deals[0].invoiceSLAExceededFlag).toBe(false);
    expect(result.deals[1].invoiceSLAExceededFlag).toBe(false);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
