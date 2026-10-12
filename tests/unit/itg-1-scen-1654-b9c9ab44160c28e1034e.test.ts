import { fetchDealsForPeriod, type FetchDealsForPeriodInput } from "../../src/logic/data-persistence";

jest.mock("../../src/platform/data-store.ts");

describe("SCEN-1654: 警告レベルが注意の場合、推奨アクションとして営業担当者への通知と進捗確認が出力される", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return deals with caution level when some deals have SLA exceeded", async () => {
    const mockStore = require("../../src/platform/data-store.ts");

    const dealData = [
      {
        id: "deal-001",
        customerId: "customer-001",
        salesRepresentativeId: "rep-001",
        dealName: "A社新規プロジェクト",
        dealAmount: 5000000,
        stageId: "提案段階",
        expectedContractDate: "2025-02-28T00:00:00Z",
        description: "新規取引先との契約案件",
        contractedDate: null,
        lossReason: null,
        createdAt: "2025-01-15T10:00:00Z",
        updatedAt: "2025-01-20T14:30:00Z",
        createdBy: "user-001",
        invoiceGenerationSLADeadline: "2025-03-07T00:00:00Z",
        invoiceSLAExceededFlag: false,
      },
      {
        id: "deal-002",
        customerId: "customer-002",
        salesRepresentativeId: "rep-002",
        dealName: "B社増設案件",
        dealAmount: 8000000,
        stageId: "交渉段階",
        expectedContractDate: "2025-03-15T00:00:00Z",
        description: "既存顧客の追加発注",
        contractedDate: null,
        lossReason: null,
        createdAt: "2025-01-10T09:00:00Z",
        updatedAt: "2025-01-25T11:00:00Z",
        createdBy: "user-001",
        invoiceGenerationSLADeadline: "2025-03-22T00:00:00Z",
        invoiceSLAExceededFlag: false,
      },
      {
        id: "deal-003",
        customerId: "customer-001",
        salesRepresentativeId: "rep-001",
        dealName: "A社保守契約",
        dealAmount: 1200000,
        stageId: "契約済み",
        expectedContractDate: "2025-02-10T00:00:00Z",
        description: "年間保守サポート契約",
        contractedDate: "2025-02-05T00:00:00Z",
        lossReason: null,
        createdAt: "2025-01-05T08:00:00Z",
        updatedAt: "2025-02-05T15:45:00Z",
        createdBy: "user-002",
        invoiceGenerationSLADeadline: "2025-02-12T00:00:00Z",
        invoiceSLAExceededFlag: true,
      },
    ];

    mockStore.listRecords.mockResolvedValue(dealData);

    const input: FetchDealsForPeriodInput = {
      periodStartDateTime: "2025-01-01T00:00:00Z",
      periodEndDateTime: "2025-02-28T23:59:59Z",
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
    expect(result.deals[0].updatedAt).toBe("2025-02-05T15:45:00Z");
    expect(result.deals[1].updatedAt).toBe("2025-01-25T11:00:00Z");
    expect(result.deals[2].updatedAt).toBe("2025-01-20T14:30:00Z");
    const cautionDeal = result.deals.find((d) => d.invoiceSLAExceededFlag === true);
    expect(cautionDeal).toBeDefined();
    expect(cautionDeal?.dealId).toBe("deal-003");
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
