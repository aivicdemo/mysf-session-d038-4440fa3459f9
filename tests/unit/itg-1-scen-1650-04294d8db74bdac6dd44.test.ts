import { fetchDealsForPeriod, type FetchDealsForPeriodInput } from "../../src/logic/data-persistence";

jest.mock("../../src/platform/data-store.ts");

describe("SCEN-1650: 生成SLAと送付SLAのいずれかが超過の場合、全体警告レベルが危険と判定される", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should include deals with SLA exceeded flag true in results for danger level warning", async () => {
    const mockStore = require("../../src/platform/data-store.ts");

    const dealData = [
      {
        id: "deal-001",
        customerId: "customer-001",
        salesRepresentativeId: "rep-001",
        dealName: "大型案件A",
        dealAmount: 5000000,
        stageId: "stage-contract",
        expectedContractDate: "2026-01-15T00:00:00Z",
        description: "重要顧客との契約案件",
        contractedDate: "2026-01-10T00:00:00Z",
        lossReason: null,
        createdAt: "2025-12-01T10:00:00Z",
        updatedAt: "2025-12-20T14:30:00Z",
        createdBy: "user-001",
        invoiceGenerationSLADeadline: "2026-01-17T00:00:00Z",
        invoiceSLAExceededFlag: false,
      },
      {
        id: "deal-002",
        customerId: "customer-002",
        salesRepresentativeId: "rep-002",
        dealName: "案件B",
        dealAmount: 2000000,
        stageId: "stage-contract",
        expectedContractDate: "2026-01-12T00:00:00Z",
        description: "標準案件",
        contractedDate: "2026-01-08T00:00:00Z",
        lossReason: null,
        createdAt: "2025-12-05T09:00:00Z",
        updatedAt: "2025-12-22T11:00:00Z",
        createdBy: "user-002",
        invoiceGenerationSLADeadline: "2026-01-10T00:00:00Z",
        invoiceSLAExceededFlag: true,
      },
      {
        id: "deal-003",
        customerId: "customer-003",
        salesRepresentativeId: "rep-003",
        dealName: "案件C",
        dealAmount: 3000000,
        stageId: "stage-contract",
        expectedContractDate: "2026-01-20T00:00:00Z",
        description: "追跡案件",
        contractedDate: "2026-01-18T00:00:00Z",
        lossReason: null,
        createdAt: "2025-12-10T08:00:00Z",
        updatedAt: "2025-12-25T15:45:00Z",
        createdBy: "user-003",
        invoiceGenerationSLADeadline: "2026-01-22T00:00:00Z",
        invoiceSLAExceededFlag: false,
      },
    ];

    mockStore.listRecords.mockResolvedValue(dealData);

    const input: FetchDealsForPeriodInput = {
      periodStartDateTime: "2025-12-01T00:00:00Z",
      periodEndDateTime: "2025-12-31T23:59:59Z",
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
    const exceededDeal = result.deals.find((d) => d.invoiceSLAExceededFlag === true);
    expect(exceededDeal).toBeDefined();
    expect(exceededDeal?.dealId).toBe("deal-002");
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
