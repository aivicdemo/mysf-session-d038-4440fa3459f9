import { aggregateMappingStatistics, AggregateMappingStatisticsOutput } from "../../src/logic/mapping-query-service";
import * as authModule from "../../src/logic/authentication-authorization";
import * as projectContextModule from "../../src/logic/project-context-resolver";
import * as mappingPersistenceModule from "../../src/logic/mapping-persistence";

jest.mock("../../src/logic/authentication-authorization");
jest.mock("../../src/logic/project-context-resolver");
jest.mock("../../src/logic/mapping-persistence");

describe("SCEN-263: aggregateMappingStatistics - Empty Mapping Data", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return statistics with all zero values when no mapping data exists", async () => {
    const userId = "user-123";
    const projectId = "proj-456";
    const targetSystemId = "sys-789";

    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      userId,
      isAuthenticated: true,
      hasAccessToProject: true,
      hasAccessToTargetSystem: true,
    });

    (projectContextModule.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
      targetSystemId,
      isValid: true,
    });

    (mappingPersistenceModule.retrieveMappingDetailsForProject as jest.Mock).mockResolvedValue([]);
    (mappingPersistenceModule.retrieveMappingValidationResultsForProject as jest.Mock).mockResolvedValue([]);
    (mappingPersistenceModule.retrieveMigrationRiskAssessmentsForProject as jest.Mock).mockResolvedValue([]);

    const result: AggregateMappingStatisticsOutput = await aggregateMappingStatistics({
      userId,
      projectId,
      targetSystemId,
    });

    expect(result.totalMappings).toBe(0);
    expect(result.mappingStatusDistribution).toBeDefined();
    expect(result.mappingStatusDistribution.completeCount).toBe(0);
    expect(result.mappingStatusDistribution.partialCount).toBe(0);
    expect(result.mappingStatusDistribution.customizationRequiredCount).toBe(0);
    expect(result.mappingStatusDistribution.nonMappingCount).toBe(0);
    expect(result.gapClassificationDistribution).toBeDefined();
    expect(result.riskDistribution).toBeDefined();
    expect(result.complexityDistribution).toBeDefined();
    expect(result.validationCoverageStatistics).toBeDefined();
    expect(result.validationCoverageStatistics.totalValidatedCount).toBe(0);
    expect(result.validationCoverageStatistics.validationCoveragePercentage).toBe(0);
    expect(result.aggregationTimestamp).toBeDefined();
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.aggregationTimestamp)).toBe(true);
  });
});
