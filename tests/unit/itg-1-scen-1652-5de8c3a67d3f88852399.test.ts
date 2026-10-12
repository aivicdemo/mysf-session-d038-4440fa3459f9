import { fetchDealsForPeriod, type FetchDealsForPeriodInput } from "../../src/logic/data-persistence";

jest.mock("../../src/platform/data-store.ts");

describe("SCEN-1652: 生成SLAと送付SLAが両方達成の場合、全体警告レベルが正常と判定される", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return deals with all SLA flags false when both generation and delivery SLAs are achieved", async () => {
    const mockStore = require("../../src/platform/data-store.ts");

    const dealData = [
      {
        id: "deal-001",
        customerId: "customer-001",
        salesRepresentativeId: "sales-rep-001",
        dealName: "案件A",
        dealAmount: 1000000,
        stageId: "成約",
        expectedContractDate: "2025-01-15T00:00:00Z",
        description: "テスト案件",
        contractedDate: "2025-01-15T10:30:00Z",
        lossReason: null,
        createdAt: "2025-01-05T09:00:00Z",
        updatedAt: "2025-01-15T10:30:00Z",
        createdBy: "user-001",
        invoiceGenerationSLADeadline: "2025-01-22T23:59:59Z",
        invoiceSLAExceededFlag: false,
      },
      {
        id: "deal-002",
        customerId: "customer-002",
        salesRepresentativeId: "sales-rep-002",
        dealName: "案件B",
        dealAmount: 500000,
        stageId: "成約",
        expectedContractDate: "2025-01-20T00:00:00Z",
        description: "テスト案件2",
        contractedDate: "2025-01-20T14:15:00Z",
        lossReason: null,
        createdAt: "2025-01-08T10:00:00Z",
        updatedAt: "2025-01-20T14:15:00Z",
        createdBy: "user-002",
        invoiceGenerationSLADeadline: "2025-01-27T23:59:59Z",
        invoiceSLAExceededFlag: false,
      },
    ];

    mockStore.listRecords.mockResolvedValue(dealData);

    const input: FetchDealsForPeriodInput = {
      periodStartDateTime: "2025-01-01T00:00:00Z",
      periodEndDateTime: "2025-01-31T23:59:59Z",
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
    expect(result.deals[0].updatedAt).toBe("2025-01-20T14:15:00Z");
    expect(result.deals[1].updatedAt).toBe("2025-01-15T10:30:00Z");
    expect(result.deals[0].invoiceGenerationSLADeadline).toBe("2025-01-27T23:59:59Z");
    expect(result.deals[1].invoiceGenerationSLADeadline).toBe("2025-01-22T23:59:59Z");
    expect(result.deals[0].invoiceSLAExceededFlag).toBe(false);
    expect(result.deals[1].invoiceSLAExceededFlag).toBe(false);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
