import { aggregateMappingStatistics, AggregateMappingStatisticsOutput } from "../../src/logic/mapping-query-service";
import * as authModule from "../../src/logic/authentication-authorization";
import * as projectContextModule from "../../src/logic/project-context-resolver";
import * as mappingPersistenceModule from "../../src/logic/mapping-persistence";

jest.mock("../../src/logic/authentication-authorization");
jest.mock("../../src/logic/project-context-resolver");
jest.mock("../../src/logic/mapping-persistence");

describe("SCEN-265: aggregateMappingStatistics - No Risk Assessment Data", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should aggregate risk distribution properly when no risk assessment data exists", async () => {
    const userId = "user-123";
    const projectId = "proj-456";
    const targetSystemId = "sys-789";

    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      userId,
      projectId,
      targetSystemId,
      hasAccess: true,
    });

    (projectContextModule.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
      targetSystemId,
      exists: true,
    });

    const mappingDetails = [
      { mappingDetailId: "map-001", projectId, targetSystemId, status: "fully_compatible" },
      { mappingDetailId: "map-002", projectId, targetSystemId, status: "partially_compatible" },
      { mappingDetailId: "map-003", projectId, targetSystemId, status: "customization_required" },
    ];

    const validationResults = [
      { validationId: "val-001", projectId, mappingDetailId: "map-001" },
      { validationId: "val-002", projectId, mappingDetailId: "map-002" },
    ];

    (mappingPersistenceModule.retrieveMappingDetailsForProject as jest.Mock).mockResolvedValue(mappingDetails);
    (mappingPersistenceModule.retrieveMappingValidationResultsForProject as jest.Mock).mockResolvedValue(validationResults);
    (mappingPersistenceModule.retrieveMigrationRiskAssessmentsForProject as jest.Mock).mockResolvedValue([]);

    const result: AggregateMappingStatisticsOutput = await aggregateMappingStatistics({
      userId,
      projectId,
      targetSystemId,
    });

    expect(result.riskDistribution).toBeDefined();
    expect(result.riskDistribution).not.toBeNull();
    expect(result.riskDistribution).not.toBeUndefined();
    expect(result.totalMappings).toBe(3);
    expect(result.validationCoverageStatistics.totalValidatedCount).toBe(2);
    expect(result.aggregationTimestamp).toBeDefined();
  });
});
