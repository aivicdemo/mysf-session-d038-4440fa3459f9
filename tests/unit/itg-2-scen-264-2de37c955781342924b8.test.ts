import { aggregateMappingStatistics, AggregateMappingStatisticsOutput } from "../../src/logic/mapping-query-service";
import * as authModule from "../../src/logic/authentication-authorization";
import * as projectContextModule from "../../src/logic/project-context-resolver";
import * as mappingPersistenceModule from "../../src/logic/mapping-persistence";

jest.mock("../../src/logic/authentication-authorization");
jest.mock("../../src/logic/project-context-resolver");
jest.mock("../../src/logic/mapping-persistence");

describe("SCEN-264: aggregateMappingStatistics - Mixed Validation Status", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should calculate validation coverage and status distribution correctly", async () => {
    const userId = "user-001";
    const projectId = "proj-migration-2025";
    const targetSystemId = "target-oracle-billing";

    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      userId,
      projectId,
      targetSystemId,
      authorized: true,
    });

    (projectContextModule.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
      targetSystemId,
      valid: true,
    });

    const mappingDetails = [
      { mappingDetailId: "map-001", projectId, targetSystemId, migrationStatus: "FULLY_COMPATIBLE" },
      { mappingDetailId: "map-002", projectId, targetSystemId, migrationStatus: "FULLY_COMPATIBLE" },
      { mappingDetailId: "map-003", projectId, targetSystemId, migrationStatus: "PARTIAL_COMPATIBLE" },
      { mappingDetailId: "map-004", projectId, targetSystemId, migrationStatus: "PARTIAL_COMPATIBLE" },
      { mappingDetailId: "map-005", projectId, targetSystemId, migrationStatus: "REQUIRES_CUSTOMIZATION" },
      { mappingDetailId: "map-006", projectId, targetSystemId, migrationStatus: "NOT_COMPATIBLE" },
    ];

    const validationResults = [
      { validationId: "val-001", mappingDetailId: "map-001", projectId, validationStatus: "VERIFIED" },
      { validationId: "val-002", mappingDetailId: "map-002", projectId, validationStatus: "VERIFIED" },
      { validationId: "val-003", mappingDetailId: "map-003", projectId, validationStatus: "VERIFIED" },
    ];

    const riskAssessments = [
      { riskAssessmentId: "risk-001", mappingDetailId: "map-001", projectId, riskLevel: "LOW", riskScore: 1.5, complexityLevel: "SIMPLE" },
      { riskAssessmentId: "risk-002", mappingDetailId: "map-002", projectId, riskLevel: "LOW", riskScore: 1.5, complexityLevel: "SIMPLE" },
      { riskAssessmentId: "risk-003", mappingDetailId: "map-003", projectId, riskLevel: "MEDIUM", riskScore: 5, complexityLevel: "MODERATE" },
      { riskAssessmentId: "risk-004", mappingDetailId: "map-004", projectId, riskLevel: "MEDIUM", riskScore: 5.5, complexityLevel: "MODERATE" },
      { riskAssessmentId: "risk-005", mappingDetailId: "map-005", projectId, riskLevel: "HIGH", riskScore: 8.5, complexityLevel: "COMPLEX" },
      { riskAssessmentId: "risk-006", mappingDetailId: "map-006", projectId, riskLevel: "HIGH", riskScore: 9, complexityLevel: "COMPLEX" },
    ];

    (mappingPersistenceModule.retrieveMappingDetailsForProject as jest.Mock).mockResolvedValue(mappingDetails);
    (mappingPersistenceModule.retrieveMappingValidationResultsForProject as jest.Mock).mockResolvedValue(validationResults);
    (mappingPersistenceModule.retrieveMigrationRiskAssessmentsForProject as jest.Mock).mockResolvedValue(riskAssessments);

    const result: AggregateMappingStatisticsOutput = await aggregateMappingStatistics({
      userId,
      projectId,
      targetSystemId,
    });

    expect(result.totalMappings).toBe(6);
    expect(result.mappingStatusDistribution.completeCount).toBe(2);
    expect(result.mappingStatusDistribution.partialCount).toBe(2);
    expect(result.mappingStatusDistribution.customizationRequiredCount).toBe(1);
    expect(result.mappingStatusDistribution.nonMappingCount).toBe(1);
    expect(result.validationCoverageStatistics.totalValidatedCount).toBe(3);
    expect(result.validationCoverageStatistics.validationCoveragePercentage).toBe(50.0);
    expect(result.riskDistribution.lowRiskCount).toBe(2);
    expect(result.riskDistribution.mediumRiskCount).toBe(2);
    expect(result.riskDistribution.highRiskCount).toBe(2);
    expect(result.complexityDistribution.lowCount).toBe(2);
    expect(result.complexityDistribution.mediumCount).toBe(2);
    expect(result.complexityDistribution.highCount).toBe(2);
    expect(result.aggregationTimestamp).toBeDefined();
  });
});
