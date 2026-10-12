import { fetchDealsForPeriod, type FetchDealsForPeriodInput } from "../../src/logic/data-persistence";
import * as dataPersistence from "../../src/logic/data-persistence";

jest.mock("../../src/platform/data-store.ts");

describe("SCEN-1646: 請求書生成が目標日数の110%を超える場合、生成SLAが超過と判定される", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should detect invoice generation SLA exceeded flag when actual days exceed 110% of target", async () => {
    const mockStore = require("../../src/platform/data-store.ts");

    const dealData = [
      {
        id: "deal-001",
        customerId: "customer-001",
        salesRepresentativeId: "rep-001",
        dealName: "大型案件A",
        dealAmount: 5000000,
        stageId: "成約",
        expectedContractDate: "2024-01-15T00:00:00Z",
        description: "テスト商談",
        contractedDate: "2024-01-15T10:00:00Z",
        lossReason: null,
        createdAt: "2024-01-01T09:00:00Z",
        updatedAt: "2024-01-15T10:00:00Z",
        createdBy: "user-001",
        invoiceGenerationSLADeadline: "2024-01-29T10:00:00Z",
        invoiceSLAExceededFlag: false,
      },
      {
        id: "deal-002",
        customerId: "customer-002",
        salesRepresentativeId: "rep-001",
        dealName: "中型案件B",
        dealAmount: 3000000,
        stageId: "成約",
        expectedContractDate: "2024-01-20T00:00:00Z",
        description: "テスト商談",
        contractedDate: "2024-01-20T14:00:00Z",
        lossReason: null,
        createdAt: "2024-01-05T09:00:00Z",
        updatedAt: "2024-01-20T14:00:00Z",
        createdBy: "user-001",
        invoiceGenerationSLADeadline: "2024-02-03T14:00:00Z",
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

    expect(result.deals).toHaveLength(2);
    expect(result.totalCount).toBe(2);
    expect(result.deals[0].dealId).toBe("deal-002");
    expect(result.deals[1].dealId).toBe("deal-001");
    expect(result.deals[0].invoiceSLAExceededFlag).toBe(true);
    expect(result.deals[1].invoiceSLAExceededFlag).toBe(false);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
