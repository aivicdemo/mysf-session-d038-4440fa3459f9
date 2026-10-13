import { searchMappingsByCondition } from "../../src/logic/mapping-query-service";
import * as mappingPersistence from "../../src/logic/mapping-persistence";
import * as authorizationService from "../../src/logic/authentication-authorization";
import * as projectContextResolver from "../../src/logic/project-context-resolver";

jest.mock("../../src/logic/mapping-persistence", () => ({
  ...jest.requireActual<typeof import("../../src/logic/mapping-persistence")>("../../src/logic/mapping-persistence"),
}));

jest.mock("../../src/logic/authentication-authorization", () => ({
  ...jest.requireActual<typeof import("../../src/logic/authentication-authorization")>("../../src/logic/authentication-authorization"),
}));

jest.mock("../../src/logic/project-context-resolver", () => ({
  ...jest.requireActual<typeof import("../../src/logic/project-context-resolver")>("../../src/logic/project-context-resolver"),
}));

describe("SCEN-249: ソート対象フィールドとソート順序を指定すると、マッピングがその順序で整形されて返される", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should sort mappings by priority in descending order", async () => {
    const mockMappingDetails = [
      {
        mappingDetailId: "map-001",
        existingFunctionName: "請求書作成",
        priority: 8,
        complexity: "高",
        migrationStatus: "進行中",
        projectId: "proj-456",
        targetSystemId: "system-789",
        mappingMethod: "Custom",
        mappingTargetObjectId: "obj-001",
        verificationStatus: "in_progress",
        createdAt: "2026-01-01",
        createdBy: "admin",
        updatedAt: "2026-01-01",
        updatedBy: "admin",
      },
      {
        mappingDetailId: "map-002",
        existingFunctionName: "請求明細追加",
        priority: 5,
        complexity: "中",
        migrationStatus: "計画中",
        projectId: "proj-456",
        targetSystemId: "system-789",
        mappingMethod: "Custom",
        mappingTargetObjectId: "obj-002",
        verificationStatus: "pending",
        createdAt: "2026-01-01",
        createdBy: "admin",
        updatedAt: "2026-01-01",
        updatedBy: "admin",
      },
      {
        mappingDetailId: "map-003",
        existingFunctionName: "請求承認",
        priority: 12,
        complexity: "低",
        migrationStatus: "完了",
        projectId: "proj-456",
        targetSystemId: "system-789",
        mappingMethod: "Direct",
        mappingTargetObjectId: "obj-003",
        verificationStatus: "verified",
        createdAt: "2026-01-01",
        createdBy: "admin",
        updatedAt: "2026-01-01",
        updatedBy: "admin",
      },
    ];

    const mockValidationResults = [
      { validationResultId: "val-001", mappingDetailId: "map-001", gapClassification: "完全対応", validationStatus: "検証完了", gapScore: 0, projectId: "proj-456", riskLevel: "低", validatorId: "admin", validationTimestamp: "2026-01-01", createdAt: "2026-01-01", createdBy: "admin", updatedAt: "2026-01-01", updatedBy: "admin" },
      { validationResultId: "val-002", mappingDetailId: "map-002", gapClassification: "部分対応", validationStatus: "検証中", gapScore: 3, projectId: "proj-456", riskLevel: "中", validatorId: "admin", validationTimestamp: "2026-01-01", createdAt: "2026-01-01", createdBy: "admin", updatedAt: "2026-01-01", updatedBy: "admin" },
      { validationResultId: "val-003", mappingDetailId: "map-003", gapClassification: "完全対応", validationStatus: "検証完了", gapScore: 0, projectId: "proj-456", riskLevel: "低", validatorId: "admin", validationTimestamp: "2026-01-01", createdAt: "2026-01-01", createdBy: "admin", updatedAt: "2026-01-01", updatedBy: "admin" },
    ];

    const mockRiskAssessments = [
      { riskAssessmentId: "risk-001", mappingDetailId: "map-001", riskLevel: "低", riskEvaluationScore: 2, projectId: "proj-456", riskClassification: "low", riskItemName: "item-001", occurrencePossibilityLevel: "low", impactLevel: "low", remediationApproach: "monitor", assessorId: "admin", assessmentTimestamp: "2026-01-01", createdAt: "2026-01-01", createdBy: "admin", updatedAt: "2026-01-01", updatedBy: "admin" },
      { riskAssessmentId: "risk-002", mappingDetailId: "map-002", riskLevel: "中", riskEvaluationScore: 5, projectId: "proj-456", riskClassification: "medium", riskItemName: "item-002", occurrencePossibilityLevel: "medium", impactLevel: "medium", remediationApproach: "mitigate", assessorId: "admin", assessmentTimestamp: "2026-01-01", createdAt: "2026-01-01", createdBy: "admin", updatedAt: "2026-01-01", updatedBy: "admin" },
      { riskAssessmentId: "risk-003", mappingDetailId: "map-003", riskLevel: "低", riskEvaluationScore: 1, projectId: "proj-456", riskClassification: "low", riskItemName: "item-003", occurrencePossibilityLevel: "low", impactLevel: "low", remediationApproach: "monitor", assessorId: "admin", assessmentTimestamp: "2026-01-01", createdAt: "2026-01-01", createdBy: "admin", updatedAt: "2026-01-01", updatedBy: "admin" },
    ];

    (authorizationService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthorized: true,
      hasProjectAccess: true,
    });

    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId: "proj-456",
      targetSystemId: "system-789",
      isValid: true,
    });

    (mappingPersistence.retrieveMappingDetailsForProject as jest.Mock).mockResolvedValue(mockMappingDetails);
    (mappingPersistence.retrieveMappingValidationResultsForProject as jest.Mock).mockResolvedValue(mockValidationResults);
    (mappingPersistence.retrieveMigrationRiskAssessmentsForProject as jest.Mock).mockResolvedValue(mockRiskAssessments);

    const result = await searchMappingsByCondition({
      userId: "user-123",
      projectId: "proj-456",
      targetSystemId: "system-789",
      sortBy: "priority",
      sortOrder: "desc",
      pageNumber: 1,
      pageSize: 10,
    });

    expect(result.mappingTableRows).toHaveLength(3);

    expect(result.mappingTableRows[0].mappingDetailId).toBe("map-003");
    expect(result.mappingTableRows[0].existingFunctionName).toBe("請求承認");
    expect(result.mappingTableRows[0].priority).toBe(12);
    expect(result.mappingTableRows[0].complexity).toBe("低");
    expect(result.mappingTableRows[0].gapClassification).toBe("完全対応");
    expect(result.mappingTableRows[0].riskLevel).toBe("低");

    expect(result.mappingTableRows[1].mappingDetailId).toBe("map-001");
    expect(result.mappingTableRows[1].existingFunctionName).toBe("請求書作成");
    expect(result.mappingTableRows[1].priority).toBe(8);
    expect(result.mappingTableRows[1].complexity).toBe("高");
    expect(result.mappingTableRows[1].gapClassification).toBe("完全対応");
    expect(result.mappingTableRows[1].riskLevel).toBe("低");

    expect(result.mappingTableRows[2].mappingDetailId).toBe("map-002");
    expect(result.mappingTableRows[2].existingFunctionName).toBe("請求明細追加");
    expect(result.mappingTableRows[2].priority).toBe(5);
    expect(result.mappingTableRows[2].complexity).toBe("中");
    expect(result.mappingTableRows[2].gapClassification).toBe("部分対応");
    expect(result.mappingTableRows[2].riskLevel).toBe("中");

    expect(result.totalRowCount).toBe(3);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.filteredRowCount).toBe(3);
  });
});
