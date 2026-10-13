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

describe("SCEN-247: 検証ステータスで絞り込みを指定すると、指定されたステータスのマッピングのみが返される", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should filter mappings by validationStatus=検証完了 and return only matching records", async () => {
    const mockMappingDetails = [
      {
        mappingDetailId: "map-001",
        existingFunctionName: "請求書ヘッダー",
        migrationStatus: "完了",
        priority: 1,
        projectId: "project-sf-migration-001",
        targetSystemId: "target-oracle-001",
        mappingMethod: "Direct",
        mappingTargetObjectId: "obj-001",
        verificationStatus: "verified",
        createdAt: "2026-01-01",
        createdBy: "admin",
        updatedAt: "2026-01-01",
        updatedBy: "admin",
      },
      {
        mappingDetailId: "map-002",
        existingFunctionName: "請求明細行",
        migrationStatus: "完了",
        priority: 2,
        projectId: "project-sf-migration-001",
        targetSystemId: "target-oracle-001",
        mappingMethod: "Direct",
        mappingTargetObjectId: "obj-002",
        verificationStatus: "verified",
        createdAt: "2026-01-01",
        createdBy: "admin",
        updatedAt: "2026-01-01",
        updatedBy: "admin",
      },
      {
        mappingDetailId: "map-003",
        existingFunctionName: "請求書集計",
        migrationStatus: "進行中",
        priority: 3,
        projectId: "project-sf-migration-001",
        targetSystemId: "target-oracle-001",
        mappingMethod: "Custom",
        mappingTargetObjectId: "obj-003",
        verificationStatus: "in_progress",
        createdAt: "2026-01-01",
        createdBy: "admin",
        updatedAt: "2026-01-01",
        updatedBy: "admin",
      },
      {
        mappingDetailId: "map-004",
        existingFunctionName: "取引先マスタ",
        migrationStatus: "計画中",
        priority: 4,
        projectId: "project-sf-migration-001",
        targetSystemId: "target-oracle-001",
        mappingMethod: "Build",
        mappingTargetObjectId: "obj-004",
        verificationStatus: "pending",
        createdAt: "2026-01-01",
        createdBy: "admin",
        updatedAt: "2026-01-01",
        updatedBy: "admin",
      },
    ];

    const mockValidationResults = [
      { validationResultId: "val-001", mappingDetailId: "map-001", validationStatus: "検証完了", gapClassification: "完全対応", gapScore: 0, projectId: "project-sf-migration-001", riskLevel: "低", validatorId: "admin", validationTimestamp: "2026-01-01", createdAt: "2026-01-01", createdBy: "admin", updatedAt: "2026-01-01", updatedBy: "admin" },
      { validationResultId: "val-002", mappingDetailId: "map-002", validationStatus: "検証完了", gapClassification: "完全対応", gapScore: 0, projectId: "project-sf-migration-001", riskLevel: "低", validatorId: "admin", validationTimestamp: "2026-01-01", createdAt: "2026-01-01", createdBy: "admin", updatedAt: "2026-01-01", updatedBy: "admin" },
      { validationResultId: "val-003", mappingDetailId: "map-003", validationStatus: "検証中", gapClassification: "部分対応", gapScore: 3, projectId: "project-sf-migration-001", riskLevel: "中", validatorId: "admin", validationTimestamp: "2026-01-01", createdAt: "2026-01-01", createdBy: "admin", updatedAt: "2026-01-01", updatedBy: "admin" },
      { validationResultId: "val-004", mappingDetailId: "map-004", validationStatus: "未検証", gapClassification: "非対応", gapScore: null, projectId: "project-sf-migration-001", riskLevel: "高", validatorId: "admin", validationTimestamp: "2026-01-01", createdAt: "2026-01-01", createdBy: "admin", updatedAt: "2026-01-01", updatedBy: "admin" },
    ];

    const mockRiskAssessments = [
      { riskAssessmentId: "risk-001", mappingDetailId: "map-001", riskLevel: "低", riskEvaluationScore: 1, projectId: "project-sf-migration-001", riskClassification: "low", riskItemName: "item-001", occurrencePossibilityLevel: "low", impactLevel: "low", remediationApproach: "monitor", assessorId: "admin", assessmentTimestamp: "2026-01-01", createdAt: "2026-01-01", createdBy: "admin", updatedAt: "2026-01-01", updatedBy: "admin" },
      { riskAssessmentId: "risk-002", mappingDetailId: "map-002", riskLevel: "低", riskEvaluationScore: 2, projectId: "project-sf-migration-001", riskClassification: "low", riskItemName: "item-002", occurrencePossibilityLevel: "low", impactLevel: "low", remediationApproach: "monitor", assessorId: "admin", assessmentTimestamp: "2026-01-01", createdAt: "2026-01-01", createdBy: "admin", updatedAt: "2026-01-01", updatedBy: "admin" },
      { riskAssessmentId: "risk-003", mappingDetailId: "map-003", riskLevel: "中", riskEvaluationScore: 5, projectId: "project-sf-migration-001", riskClassification: "medium", riskItemName: "item-003", occurrencePossibilityLevel: "medium", impactLevel: "medium", remediationApproach: "mitigate", assessorId: "admin", assessmentTimestamp: "2026-01-01", createdAt: "2026-01-01", createdBy: "admin", updatedAt: "2026-01-01", updatedBy: "admin" },
      { riskAssessmentId: "risk-004", mappingDetailId: "map-004", riskLevel: "高", riskEvaluationScore: 8, projectId: "project-sf-migration-001", riskClassification: "high", riskItemName: "item-004", occurrencePossibilityLevel: "high", impactLevel: "high", remediationApproach: "avoid", assessorId: "admin", assessmentTimestamp: "2026-01-01", createdAt: "2026-01-01", createdBy: "admin", updatedAt: "2026-01-01", updatedBy: "admin" },
    ];

    (authorizationService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthorized: true,
      userId: "user-001",
    });

    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId: "project-sf-migration-001",
      targetSystemId: "target-oracle-001",
      isValid: true,
    });

    (mappingPersistence.retrieveMappingDetailsForProject as jest.Mock).mockResolvedValue(mockMappingDetails);
    (mappingPersistence.retrieveMappingValidationResultsForProject as jest.Mock).mockResolvedValue(mockValidationResults);
    (mappingPersistence.retrieveMigrationRiskAssessmentsForProject as jest.Mock).mockResolvedValue(mockRiskAssessments);

    const result = await searchMappingsByCondition({
      userId: "user-001",
      projectId: "project-sf-migration-001",
      targetSystemId: "target-oracle-001",
      validationStatus: "検証完了",
      pageNumber: 1,
      pageSize: 10,
    });

    expect(result.mappingTableRows).toHaveLength(2);
    expect(result.mappingTableRows[0].mappingDetailId).toBe("map-001");
    expect(result.mappingTableRows[0].existingFunctionName).toBe("請求書ヘッダー");
    expect(result.mappingTableRows[0].validationStatus).toBe("検証完了");
    expect(result.mappingTableRows[0].gapClassification).toBe("完全対応");
    expect(result.mappingTableRows[0].riskLevel).toBe("低");
    expect(result.mappingTableRows[0].priority).toBe(1);

    expect(result.mappingTableRows[1].mappingDetailId).toBe("map-002");
    expect(result.mappingTableRows[1].existingFunctionName).toBe("請求明細行");
    expect(result.mappingTableRows[1].validationStatus).toBe("検証完了");
    expect(result.mappingTableRows[1].gapClassification).toBe("完全対応");
    expect(result.mappingTableRows[1].riskLevel).toBe("低");
    expect(result.mappingTableRows[1].priority).toBe(2);

    expect(result.totalRowCount).toBe(2);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.filteredRowCount).toBe(2);
  });
});
