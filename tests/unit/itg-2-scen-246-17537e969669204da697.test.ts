import { searchMappingsByCondition, InvalidSearchConditionError } from "../../src/logic/mapping-query-service";
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

describe("SCEN-246: 複雑度で絞り込みを指定すると、指定された複雑度のマッピングのみが返される", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should filter mappings by complexity=中 and return only matching records", async () => {
    const mockMappingDetails = [
      {
        mappingDetailId: "map-001",
        existingFunctionName: "取引先責任者住所自動入力",
        complexity: "低",
        migrationStatus: "完了",
        priority: 1,
        projectId: "proj-sf-migration-2026",
        targetSystemId: "target-oracle-erp-001",
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
        existingFunctionName: "商談商品数量集計",
        complexity: "中",
        migrationStatus: "進行中",
        priority: 2,
        projectId: "proj-sf-migration-2026",
        targetSystemId: "target-oracle-erp-001",
        mappingMethod: "Custom",
        mappingTargetObjectId: "obj-002",
        verificationStatus: "in_progress",
        createdAt: "2026-01-01",
        createdBy: "admin",
        updatedAt: "2026-01-01",
        updatedBy: "admin",
      },
      {
        mappingDetailId: "map-003",
        existingFunctionName: "請求明細計算ロジック",
        complexity: "中",
        migrationStatus: "進行中",
        priority: 3,
        projectId: "proj-sf-migration-2026",
        targetSystemId: "target-oracle-erp-001",
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
        existingFunctionName: "請求承認フロー",
        complexity: "高",
        migrationStatus: "計画中",
        priority: 4,
        projectId: "proj-sf-migration-2026",
        targetSystemId: "target-oracle-erp-001",
        mappingMethod: "Build",
        mappingTargetObjectId: "obj-004",
        verificationStatus: "pending",
        createdAt: "2026-01-01",
        createdBy: "admin",
        updatedAt: "2026-01-01",
        updatedBy: "admin",
      },
      {
        mappingDetailId: "map-005",
        existingFunctionName: "活動レポート生成",
        complexity: "中",
        migrationStatus: "完了",
        priority: 5,
        projectId: "proj-sf-migration-2026",
        targetSystemId: "target-oracle-erp-001",
        mappingMethod: "Report",
        mappingTargetObjectId: "obj-005",
        verificationStatus: "verified",
        createdAt: "2026-01-01",
        createdBy: "admin",
        updatedAt: "2026-01-01",
        updatedBy: "admin",
      },
    ];

    const mockValidationResults = [
      { validationResultId: "val-001", mappingDetailId: "map-001", gapClassification: "完全対応", validationStatus: "検証完了", gapScore: 0, projectId: "proj-sf-migration-2026", riskLevel: "低", validatorId: "admin", validationTimestamp: "2026-01-01", createdAt: "2026-01-01", createdBy: "admin", updatedAt: "2026-01-01", updatedBy: "admin" },
      { validationResultId: "val-002", mappingDetailId: "map-002", gapClassification: "部分対応", validationStatus: "検証完了", gapScore: 3, projectId: "proj-sf-migration-2026", riskLevel: "中", validatorId: "admin", validationTimestamp: "2026-01-01", createdAt: "2026-01-01", createdBy: "admin", updatedAt: "2026-01-01", updatedBy: "admin" },
      { validationResultId: "val-003", mappingDetailId: "map-003", gapClassification: "カスタマイズ必要", validationStatus: "検証中", gapScore: 5, projectId: "proj-sf-migration-2026", riskLevel: "中", validatorId: "admin", validationTimestamp: "2026-01-01", createdAt: "2026-01-01", createdBy: "admin", updatedAt: "2026-01-01", updatedBy: "admin" },
      { validationResultId: "val-004", mappingDetailId: "map-004", gapClassification: "カスタマイズ必要", validationStatus: "未検証", gapScore: 7, projectId: "proj-sf-migration-2026", riskLevel: "高", validatorId: "admin", validationTimestamp: "2026-01-01", createdAt: "2026-01-01", createdBy: "admin", updatedAt: "2026-01-01", updatedBy: "admin" },
      { validationResultId: "val-005", mappingDetailId: "map-005", gapClassification: "部分対応", validationStatus: "検証完了", gapScore: 2, projectId: "proj-sf-migration-2026", riskLevel: "低", validatorId: "admin", validationTimestamp: "2026-01-01", createdAt: "2026-01-01", createdBy: "admin", updatedAt: "2026-01-01", updatedBy: "admin" },
    ];

    const mockRiskAssessments = [
      { riskAssessmentId: "risk-001", mappingDetailId: "map-001", riskLevel: "低", riskEvaluationScore: 1, projectId: "proj-sf-migration-2026", riskClassification: "low", riskItemName: "item-001", occurrencePossibilityLevel: "low", impactLevel: "low", remediationApproach: "monitor", assessorId: "admin", assessmentTimestamp: "2026-01-01", createdAt: "2026-01-01", createdBy: "admin", updatedAt: "2026-01-01", updatedBy: "admin" },
      { riskAssessmentId: "risk-002", mappingDetailId: "map-002", riskLevel: "中", riskEvaluationScore: 5, projectId: "proj-sf-migration-2026", riskClassification: "medium", riskItemName: "item-002", occurrencePossibilityLevel: "medium", impactLevel: "medium", remediationApproach: "mitigate", assessorId: "admin", assessmentTimestamp: "2026-01-01", createdAt: "2026-01-01", createdBy: "admin", updatedAt: "2026-01-01", updatedBy: "admin" },
      { riskAssessmentId: "risk-003", mappingDetailId: "map-003", riskLevel: "中", riskEvaluationScore: 5, projectId: "proj-sf-migration-2026", riskClassification: "medium", riskItemName: "item-003", occurrencePossibilityLevel: "medium", impactLevel: "medium", remediationApproach: "mitigate", assessorId: "admin", assessmentTimestamp: "2026-01-01", createdAt: "2026-01-01", createdBy: "admin", updatedAt: "2026-01-01", updatedBy: "admin" },
      { riskAssessmentId: "risk-004", mappingDetailId: "map-004", riskLevel: "高", riskEvaluationScore: 8, projectId: "proj-sf-migration-2026", riskClassification: "high", riskItemName: "item-004", occurrencePossibilityLevel: "high", impactLevel: "high", remediationApproach: "avoid", assessorId: "admin", assessmentTimestamp: "2026-01-01", createdAt: "2026-01-01", createdBy: "admin", updatedAt: "2026-01-01", updatedBy: "admin" },
      { riskAssessmentId: "risk-005", mappingDetailId: "map-005", riskLevel: "低", riskEvaluationScore: 1, projectId: "proj-sf-migration-2026", riskClassification: "low", riskItemName: "item-005", occurrencePossibilityLevel: "low", impactLevel: "low", remediationApproach: "monitor", assessorId: "admin", assessmentTimestamp: "2026-01-01", createdAt: "2026-01-01", createdBy: "admin", updatedAt: "2026-01-01", updatedBy: "admin" },
    ];

    (authorizationService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthorized: true,
      userId: "user-001",
    });

    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId: "proj-sf-migration-2026",
      targetSystemId: "target-oracle-erp-001",
      isValid: true,
      projectName: "Salesforce移行プロジェクト2026",
      targetSystemName: "Oracle請求システム",
    });

    (mappingPersistence.retrieveMappingDetailsForProject as jest.Mock).mockResolvedValue(mockMappingDetails);
    (mappingPersistence.retrieveMappingValidationResultsForProject as jest.Mock).mockResolvedValue(mockValidationResults);
    (mappingPersistence.retrieveMigrationRiskAssessmentsForProject as jest.Mock).mockResolvedValue(mockRiskAssessments);

    const result = await searchMappingsByCondition({
      userId: "user-001",
      projectId: "proj-sf-migration-2026",
      targetSystemId: "target-oracle-erp-001",
      complexity: "中",
      pageNumber: 1,
      pageSize: 10,
    });

    expect(result.mappingTableRows).toHaveLength(3);
    expect(result.mappingTableRows[0].mappingDetailId).toBe("map-002");
    expect(result.mappingTableRows[0].existingFunctionName).toBe("商談商品数量集計");
    expect(result.mappingTableRows[0].complexity).toBe("中");
    expect(result.mappingTableRows[1].mappingDetailId).toBe("map-003");
    expect(result.mappingTableRows[1].existingFunctionName).toBe("請求明細計算ロジック");
    expect(result.mappingTableRows[1].complexity).toBe("中");
    expect(result.mappingTableRows[2].mappingDetailId).toBe("map-005");
    expect(result.mappingTableRows[2].existingFunctionName).toBe("活動レポート生成");
    expect(result.mappingTableRows[2].complexity).toBe("中");

    expect(result.totalRowCount).toBe(3);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.filteredRowCount).toBe(3);
  });
});
