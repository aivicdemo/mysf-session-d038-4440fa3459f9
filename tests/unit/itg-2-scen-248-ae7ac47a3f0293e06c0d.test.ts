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

describe("SCEN-248: 優先度の範囲を指定して絞り込むと、指定された範囲内のマッピングのみが返される", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should filter mappings by priority range [3,7] sorted by priority asc", async () => {
    const mockMappingDetails = [
      {
        mappingDetailId: "map-001",
        existingFunctionName: "請求書ヘッダ作成",
        priority: 2,
        migrationStatus: "完了",
        projectId: "proj-migration-001",
        targetSystemId: "oracle-erp-001",
        mappingMethod: "Direct",
        mappingTargetObjectId: "obj-001",
        complexity: "低",
        verificationStatus: "verified",
        createdAt: "2026-01-01",
        createdBy: "admin",
        updatedAt: "2026-01-01",
        updatedBy: "admin",
      },
      {
        mappingDetailId: "map-002",
        existingFunctionName: "請求書明細登録",
        priority: 5,
        migrationStatus: "進行中",
        projectId: "proj-migration-001",
        targetSystemId: "oracle-erp-001",
        mappingMethod: "Custom",
        mappingTargetObjectId: "obj-002",
        complexity: "中",
        verificationStatus: "in_progress",
        createdAt: "2026-01-01",
        createdBy: "admin",
        updatedAt: "2026-01-01",
        updatedBy: "admin",
      },
      {
        mappingDetailId: "map-003",
        existingFunctionName: "請求額集計",
        priority: 7,
        migrationStatus: "計画中",
        projectId: "proj-migration-001",
        targetSystemId: "oracle-erp-001",
        mappingMethod: "Build",
        mappingTargetObjectId: "obj-003",
        complexity: "高",
        verificationStatus: "pending",
        createdAt: "2026-01-01",
        createdBy: "admin",
        updatedAt: "2026-01-01",
        updatedBy: "admin",
      },
      {
        mappingDetailId: "map-004",
        existingFunctionName: "売上認識処理",
        priority: 8,
        migrationStatus: "計画中",
        projectId: "proj-migration-001",
        targetSystemId: "oracle-erp-001",
        mappingMethod: "Build",
        mappingTargetObjectId: "obj-004",
        complexity: "高",
        verificationStatus: "pending",
        createdAt: "2026-01-01",
        createdBy: "admin",
        updatedAt: "2026-01-01",
        updatedBy: "admin",
      },
      {
        mappingDetailId: "map-005",
        existingFunctionName: "請求書承認フロー",
        priority: 6,
        migrationStatus: "進行中",
        projectId: "proj-migration-001",
        targetSystemId: "oracle-erp-001",
        mappingMethod: "Custom",
        mappingTargetObjectId: "obj-005",
        complexity: "中",
        verificationStatus: "in_progress",
        createdAt: "2026-01-01",
        createdBy: "admin",
        updatedAt: "2026-01-01",
        updatedBy: "admin",
      },
    ];

    const mockValidationResults = [
      { validationResultId: "val-001", mappingDetailId: "map-001", gapClassification: "完全対応", validationStatus: "検証完了", gapScore: 0, projectId: "proj-migration-001", riskLevel: "低", validatorId: "admin", validationTimestamp: "2026-01-01", createdAt: "2026-01-01", createdBy: "admin", updatedAt: "2026-01-01", updatedBy: "admin" },
      { validationResultId: "val-002", mappingDetailId: "map-002", gapClassification: "部分対応", validationStatus: "検証中", gapScore: 3, projectId: "proj-migration-001", riskLevel: "中", validatorId: "admin", validationTimestamp: "2026-01-01", createdAt: "2026-01-01", createdBy: "admin", updatedAt: "2026-01-01", updatedBy: "admin" },
      { validationResultId: "val-003", mappingDetailId: "map-003", gapClassification: "カスタマイズ必要", validationStatus: "未検証", gapScore: 5, projectId: "proj-migration-001", riskLevel: "高", validatorId: "admin", validationTimestamp: "2026-01-01", createdAt: "2026-01-01", createdBy: "admin", updatedAt: "2026-01-01", updatedBy: "admin" },
      { validationResultId: "val-004", mappingDetailId: "map-004", gapClassification: "非対応", validationStatus: "未検証", gapScore: 10, projectId: "proj-migration-001", riskLevel: "高", validatorId: "admin", validationTimestamp: "2026-01-01", createdAt: "2026-01-01", createdBy: "admin", updatedAt: "2026-01-01", updatedBy: "admin" },
      { validationResultId: "val-005", mappingDetailId: "map-005", gapClassification: "部分対応", validationStatus: "検証完了", gapScore: 2, projectId: "proj-migration-001", riskLevel: "中", validatorId: "admin", validationTimestamp: "2026-01-01", createdAt: "2026-01-01", createdBy: "admin", updatedAt: "2026-01-01", updatedBy: "admin" },
    ];

    const mockRiskAssessments = [
      { riskAssessmentId: "risk-001", mappingDetailId: "map-001", riskLevel: "低", riskEvaluationScore: 1, projectId: "proj-migration-001", riskClassification: "low", riskItemName: "item-001", occurrencePossibilityLevel: "low", impactLevel: "low", remediationApproach: "monitor", assessorId: "admin", assessmentTimestamp: "2026-01-01", createdAt: "2026-01-01", createdBy: "admin", updatedAt: "2026-01-01", updatedBy: "admin" },
      { riskAssessmentId: "risk-002", mappingDetailId: "map-002", riskLevel: "中", riskEvaluationScore: 5, projectId: "proj-migration-001", riskClassification: "medium", riskItemName: "item-002", occurrencePossibilityLevel: "medium", impactLevel: "medium", remediationApproach: "mitigate", assessorId: "admin", assessmentTimestamp: "2026-01-01", createdAt: "2026-01-01", createdBy: "admin", updatedAt: "2026-01-01", updatedBy: "admin" },
      { riskAssessmentId: "risk-003", mappingDetailId: "map-003", riskLevel: "高", riskEvaluationScore: 8, projectId: "proj-migration-001", riskClassification: "high", riskItemName: "item-003", occurrencePossibilityLevel: "high", impactLevel: "high", remediationApproach: "avoid", assessorId: "admin", assessmentTimestamp: "2026-01-01", createdAt: "2026-01-01", createdBy: "admin", updatedAt: "2026-01-01", updatedBy: "admin" },
      { riskAssessmentId: "risk-004", mappingDetailId: "map-004", riskLevel: "高", riskEvaluationScore: 9, projectId: "proj-migration-001", riskClassification: "high", riskItemName: "item-004", occurrencePossibilityLevel: "high", impactLevel: "high", remediationApproach: "avoid", assessorId: "admin", assessmentTimestamp: "2026-01-01", createdAt: "2026-01-01", createdBy: "admin", updatedAt: "2026-01-01", updatedBy: "admin" },
      { riskAssessmentId: "risk-005", mappingDetailId: "map-005", riskLevel: "中", riskEvaluationScore: 5, projectId: "proj-migration-001", riskClassification: "medium", riskItemName: "item-005", occurrencePossibilityLevel: "medium", impactLevel: "medium", remediationApproach: "mitigate", assessorId: "admin", assessmentTimestamp: "2026-01-01", createdAt: "2026-01-01", createdBy: "admin", updatedAt: "2026-01-01", updatedBy: "admin" },
    ];

    (authorizationService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthorized: true,
      userId: "user-001",
    });

    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId: "proj-migration-001",
      targetSystemId: "oracle-erp-001",
      valid: true,
    });

    (mappingPersistence.retrieveMappingDetailsForProject as jest.Mock).mockResolvedValue(mockMappingDetails);
    (mappingPersistence.retrieveMappingValidationResultsForProject as jest.Mock).mockResolvedValue(mockValidationResults);
    (mappingPersistence.retrieveMigrationRiskAssessmentsForProject as jest.Mock).mockResolvedValue(mockRiskAssessments);

    const result = await searchMappingsByCondition({
      userId: "user-001",
      projectId: "proj-migration-001",
      targetSystemId: "oracle-erp-001",
      priority: { min: 3, max: 7 },
      sortBy: "priority",
      sortOrder: "asc",
      pageNumber: 1,
      pageSize: 10,
    });

    expect(result.mappingTableRows).toHaveLength(3);

    expect(result.mappingTableRows[0].mappingDetailId).toBe("map-002");
    expect(result.mappingTableRows[0].existingFunctionName).toBe("請求書明細登録");
    expect(result.mappingTableRows[0].priority).toBe(5);
    expect(result.mappingTableRows[0].gapClassification).toBe("部分対応");
    expect(result.mappingTableRows[0].riskLevel).toBe("中");
    expect(result.mappingTableRows[0].complexity).toBe("中");
    expect(result.mappingTableRows[0].validationStatus).toBe("検証中");

    expect(result.mappingTableRows[1].mappingDetailId).toBe("map-005");
    expect(result.mappingTableRows[1].existingFunctionName).toBe("請求書承認フロー");
    expect(result.mappingTableRows[1].priority).toBe(6);
    expect(result.mappingTableRows[1].gapClassification).toBe("部分対応");
    expect(result.mappingTableRows[1].riskLevel).toBe("中");
    expect(result.mappingTableRows[1].complexity).toBe("中");
    expect(result.mappingTableRows[1].validationStatus).toBe("検証完了");

    expect(result.mappingTableRows[2].mappingDetailId).toBe("map-003");
    expect(result.mappingTableRows[2].existingFunctionName).toBe("請求額集計");
    expect(result.mappingTableRows[2].priority).toBe(7);
    expect(result.mappingTableRows[2].gapClassification).toBe("カスタマイズ必要");
    expect(result.mappingTableRows[2].riskLevel).toBe("高");
    expect(result.mappingTableRows[2].complexity).toBe("高");
    expect(result.mappingTableRows[2].validationStatus).toBe("未検証");

    expect(result.totalRowCount).toBe(3);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.filteredRowCount).toBe(3);
  });
});
