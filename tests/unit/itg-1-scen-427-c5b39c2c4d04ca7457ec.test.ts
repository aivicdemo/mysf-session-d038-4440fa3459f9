import { aggregateSalesPerformanceForDashboard } from "../../src/logic/sales-performance-aggregation";
import type {
  FetchDealsForPeriodOutput,
  FetchAllSalesRepresentativesOutput,
  FetchActivitiesByRepresentativeOutput,
  FetchSalesTargetsOutput,
  FetchAllDealStagesOutput,
  FetchUserPermissionsOutput,
} from "../../src/logic/data-persistence";
import * as dataPersistence from "../../src/logic/data-persistence";

jest.mock("../../src/logic/data-persistence", () => ({
  ...jest.requireActual<typeof import("../../src/logic/data-persistence")>(
    "../../src/logic/data-persistence"
  ),
}));

describe("SCEN-427: aggregateSalesPerformanceForDashboard - Invoice amount exceeds deal amount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw error when invoiced amount exceeds deal amount", async () => {
    const targetPeriod = "2024-01";
    const currentDate = new Date("2024-01-31T23:59:59Z");
    const requestingUserId = "USER-001";

    const mockDealsOutput: FetchDealsForPeriodOutput = {
      deals: [
        {
          dealId: "DEAL-001",
          customerId: "CUST-001",
          salesRepresentativeId: "REP-A",
          dealName: "Deal 001",
          dealAmount: 1000000,
          stageId: "STAGE-001",
          expectedContractDate: "2024-01-15",
          contractedDate: "2024-01-15",
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: "2024-01-10T00:00:00Z",
          updatedAt: "2024-01-15T00:00:00Z",
          createdBy: "REP-A",
        },
        {
          dealId: "DEAL-002",
          customerId: "CUST-002",
          salesRepresentativeId: "REP-A",
          dealName: "Deal 002",
          dealAmount: 500000,
          stageId: "STAGE-001",
          expectedContractDate: "2024-01-10",
          contractedDate: "2024-01-10",
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-10T00:00:00Z",
          createdBy: "REP-A",
        },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    };

    const mockRepsOutput: FetchAllSalesRepresentativesOutput = {
      salesRepresentatives: [
        {
          salesRepresentativeId: "REP-A",
          name: "営業担当者A",
          emailAddress: "rep-a@example.com",
          phoneNumber: null,
          department: "営業部",
          jobTitle: null,
          supervisorId: null,
          status: "active",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
          createdBy: "ADMIN",
          updatedBy: null,
        },
      ],
      totalCount: 1,
      fetchedAt: new Date().toISOString(),
    };

    const mockActivitiesOutput: FetchActivitiesByRepresentativeOutput = {
      activities: [
        {
          activityId: "ACT-001",
          customerId: "CUST-001",
          salesRepresentativeId: "REP-A",
          activityType: "visit",
          activityDateTime: "2024-01-15T10:00:00Z",
          activityContent: "Visit",
          nextFollowUpScheduledDate: null,
          dealId: null,
          estimatedAmount: null,
          contractedFlag: false,
          activityDurationMinutes: 30,
          activityCount: 1,
          activityFrequency: "once",
          activityResult: "successful",
          nextAction: null,
          createdAt: "2024-01-15T10:00:00Z",
          updatedAt: "2024-01-15T10:00:00Z",
          createdBy: "REP-A",
        },
      ],
      totalCount: 1,
      fetchedAt: new Date().toISOString(),
    };

    const mockTargetsOutput: FetchSalesTargetsOutput = {
      salesTargets: [
        {
          salesTargetId: "TARGET-001",
          salesRepresentativeId: "REP-A",
          customerId: null,
          targetYearMonth: "2024-01",
          targetAmount: 2000000,
          targetCount: 10,
          status: "active",
          remarks: null,
          createdAt: "2024-01-01T00:00:00Z",
          createdBy: "ADMIN",
          updatedAt: "2024-01-01T00:00:00Z",
          updatedBy: "ADMIN",
        },
      ],
      totalCount: 1,
      fetchedAt: new Date().toISOString(),
    };

    const mockStagesOutput: FetchAllDealStagesOutput = {
      stages: [
        {
          stageId: "STAGE-001",
          stageName: "初期接触",
          stageOrder: 1,
          description: null,
          contractedStageFlag: false,
          lossStageFlag: false,
          validFlag: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
          createdBy: "ADMIN",
          updatedBy: "ADMIN",
        },
        {
          stageId: "STAGE-002",
          stageName: "提案",
          stageOrder: 2,
          description: null,
          contractedStageFlag: false,
          lossStageFlag: false,
          validFlag: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
          createdBy: "ADMIN",
          updatedBy: "ADMIN",
        },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    };

    const mockPermissionsOutput: FetchUserPermissionsOutput = {
      permissions: [
        {
          permissionId: "PERM-001",
          userId: "USER-001",
          permissionCode: "VIEW_DASHBOARD",
          permissionName: "View Dashboard",
          description: null,
          validFlag: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
          createdBy: "ADMIN",
          updatedBy: "ADMIN",
        },
      ],
      totalCount: 1,
      fetchedAt: new Date().toISOString(),
    };

    jest.mocked(dataPersistence.fetchDealsForPeriod).mockResolvedValue(mockDealsOutput);
    jest.mocked(dataPersistence.fetchAllSalesRepresentatives).mockResolvedValue(mockRepsOutput);
    jest.mocked(dataPersistence.fetchActivitiesByRepresentative).mockResolvedValue(mockActivitiesOutput);
    jest.mocked(dataPersistence.fetchSalesTargets).mockResolvedValue(mockTargetsOutput);
    jest.mocked(dataPersistence.fetchAllDealStages).mockResolvedValue(mockStagesOutput);
    jest.mocked(dataPersistence.fetchUserPermissions).mockResolvedValue(mockPermissionsOutput);

    await expect(
      aggregateSalesPerformanceForDashboard({
        targetPeriod,
        currentDate,
        requestingUserId,
      })
    ).rejects.toThrow("請求金額が商談金額を超えています。データを確認してください");
  });
});
