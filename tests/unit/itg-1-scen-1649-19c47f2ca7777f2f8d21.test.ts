import { fetchDealsForPeriod, type FetchDealsForPeriodInput } from "../../src/logic/data-persistence";

jest.mock("../../src/platform/data-store.ts");

describe("SCEN-1649: 顧客送付が目標日数の110%を超える場合、送付SLAが超過と判定される", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should detect when some deals have invoice SLA exceeded flag true", async () => {
    const mockStore = require("../../src/platform/data-store.ts");

    const dealData = [
      {
        id: "deal-001",
        customerId: "customer-001",
        salesRepresentativeId: "rep-001",
        dealName: "案件A",
        dealAmount: 1000000,
        stageId: "契約段階",
        expectedContractDate: "2024-01-15T00:00:00Z",
        description: "テスト商談",
        contractedDate: "2024-01-10T00:00:00Z",
        lossReason: null,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-10T09:00:00Z",
        createdBy: "user-001",
        invoiceGenerationSLADeadline: "2024-01-13T00:00:00Z",
        invoiceSLAExceededFlag: false,
      },
      {
        id: "deal-002",
        customerId: "customer-002",
        salesRepresentativeId: "rep-002",
        dealName: "案件B",
        dealAmount: 500000,
        stageId: "提案段階",
        expectedContractDate: "2024-02-01T00:00:00Z",
        description: "テスト商談2",
        contractedDate: "2024-01-20T00:00:00Z",
        lossReason: null,
        createdAt: "2024-01-05T00:00:00Z",
        updatedAt: "2024-01-20T10:30:00Z",
        createdBy: "user-001",
        invoiceGenerationSLADeadline: "2024-01-23T00:00:00Z",
        invoiceSLAExceededFlag: true,
      },
      {
        id: "deal-003",
        customerId: "customer-001",
        salesRepresentativeId: "rep-001",
        dealName: "案件C",
        dealAmount: 750000,
        stageId: "契約段階",
        expectedContractDate: "2024-02-10T00:00:00Z",
        description: "テスト商談3",
        contractedDate: "2024-01-25T00:00:00Z",
        lossReason: null,
        createdAt: "2024-01-08T00:00:00Z",
        updatedAt: "2024-01-25T14:00:00Z",
        createdBy: "user-001",
        invoiceGenerationSLADeadline: "2024-01-27T18:00:00Z",
        invoiceSLAExceededFlag: true,
      },
    ];

    mockStore.listRecords.mockResolvedValue(dealData);

    const input: FetchDealsForPeriodInput = {
      periodStartDateTime: "2024-01-01T00:00:00Z",
      periodEndDateTime: "2024-01-31T23:59:59Z",
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: "updatedAt",
    };

    const result = await fetchDealsForPeriod(input);

    expect(result.deals).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    expect(result.deals[0].dealId).toBe("deal-003");
    expect(result.deals[1].dealId).toBe("deal-002");
    expect(result.deals[2].dealId).toBe("deal-001");
    expect(result.deals[0].invoiceSLAExceededFlag).toBe(true);
    expect(result.deals[1].invoiceSLAExceededFlag).toBe(true);
    expect(result.deals[2].invoiceSLAExceededFlag).toBe(false);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
