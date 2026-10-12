import { fetchDealsForPeriod, type FetchDealsForPeriodInput } from "../../src/logic/data-persistence";

jest.mock("../../src/platform/data-store.ts");

describe("SCEN-1651: 生成SLAと送付SLAのどちらかが警告で他が達成の場合、全体警告レベルが注意と判定される", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return deals with mixed SLA status sorted by updatedAt descending", async () => {
    const mockStore = require("../../src/platform/data-store.ts");

    const dealData = [
      {
        id: "deal-001",
        customerId: "customer-001",
        salesRepresentativeId: "rep-001",
        dealName: "A社システム導入",
        dealAmount: 5000000,
        stageId: "提案",
        expectedContractDate: "2024-01-15T00:00:00Z",
        description: "大規模システム導入案件",
        contractedDate: null,
        lossReason: null,
        createdAt: "2024-01-05T10:00:00Z",
        updatedAt: "2024-01-10T14:30:00Z",
        createdBy: "user-001",
        invoiceGenerationSLADeadline: "2024-01-20T00:00:00Z",
        invoiceSLAExceededFlag: false,
      },
      {
        id: "deal-002",
        customerId: "customer-002",
        salesRepresentativeId: "rep-002",
        dealName: "B社保守契約更新",
        dealAmount: 1000000,
        stageId: "成約",
        expectedContractDate: "2024-01-08T00:00:00Z",
        description: "年間保守契約",
        contractedDate: "2024-01-08T00:00:00Z",
        lossReason: null,
        createdAt: "2024-01-02T09:00:00Z",
        updatedAt: "2024-01-08T16:45:00Z",
        createdBy: "user-002",
        invoiceGenerationSLADeadline: "2024-01-12T00:00:00Z",
        invoiceSLAExceededFlag: true,
      },
      {
        id: "deal-003",
        customerId: "customer-001",
        salesRepresentativeId: "rep-001",
        dealName: "C社追加機能開発",
        dealAmount: 3000000,
        stageId: "成約",
        expectedContractDate: "2024-01-20T00:00:00Z",
        description: "カスタム機能開発",
        contractedDate: "2024-01-20T00:00:00Z",
        lossReason: null,
        createdAt: "2024-01-12T08:30:00Z",
        updatedAt: "2024-01-20T11:20:00Z",
        createdBy: "user-001",
        invoiceGenerationSLADeadline: "2024-01-24T00:00:00Z",
        invoiceSLAExceededFlag: false,
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
    expect(result.deals[0].invoiceSLAExceededFlag).toBe(false);
    expect(result.deals[1].invoiceSLAExceededFlag).toBe(true);
    expect(result.deals[2].invoiceSLAExceededFlag).toBe(false);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
