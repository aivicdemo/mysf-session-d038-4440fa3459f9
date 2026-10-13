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

describe("SCEN-250: ページネーション用のページ番号とページサイズを指定すると、該当ページのみのマッピングが返され、全件数とページ情報が含まれる", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return page 2 with 10 items per page from 25 total records", async () => {
    const mockMappingDetails = Array.from({ length: 25 }, (_, i) => ({
      mappingDetailId: `map-${String(i + 1).padStart(3, "0")}`,
      existingFunctionName: `関数名-${i + 1}`,
      priority: ((i % 5) + 1) as number,
      migrationStatus: i < 10 ? "完了" : i < 20 ? "進行中" : "計画中",
      projectId: "proj-migration-2024",
      targetSystemId: "target-oracle-billing",
      mappingMethod: "Direct",
      mappingTargetObjectId: `obj-${i + 1}`,
      complexity: i % 3 === 0 ? "高" : i % 3 === 1 ? "中" : "低",
      verificationStatus: "verified",
      createdAt: "2026-01-01",
      createdBy: "admin",
      updatedAt: "2026-01-01",
      updatedBy: "admin",
    }));

    const mockValidationResults = Array.from({ length: 25 }, (_, i) => ({
      validationResultId: `val-${i + 1}`,
      mappingDetailId: `map-${String(i + 1).padStart(3, "0")}`,
      gapClassification: i % 3 === 0 ? "完全対応" : "部分対応",
      validationStatus: "検証完了",
      gapScore: i % 10,
      projectId: "proj-migration-2024",
      riskLevel: i % 4 === 0 ? "高" : i % 4 === 1 ? "中" : "低",
      validatorId: "admin",
      validationTimestamp: "2026-01-01",
      createdAt: "2026-01-01",
      createdBy: "admin",
      updatedAt: "2026-01-01",
      updatedBy: "admin",
    }));

    const mockRiskAssessments = Array.from({ length: 25 }, (_, i) => ({
      riskAssessmentId: `risk-${i + 1}`,
      mappingDetailId: `map-${String(i + 1).padStart(3, "0")}`,
      riskLevel: i % 4 === 0 ? "高" : i % 4 === 1 ? "中" : "低",
      riskEvaluationScore: (i % 10) + 1,
      projectId: "proj-migration-2024",
      riskClassification: "general",
      riskItemName: `item-${i + 1}`,
      occurrencePossibilityLevel: "medium",
      impactLevel: "medium",
      remediationApproach: "mitigate",
      assessorId: "admin",
      assessmentTimestamp: "2026-01-01",
      createdAt: "2026-01-01",
      createdBy: "admin",
      updatedAt: "2026-01-01",
      updatedBy: "admin",
    }));

    (authorizationService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      hasProjectAccess: true,
    });

    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId: "proj-migration-2024",
      targetSystemId: "target-oracle-billing",
      isValid: true,
    });

    (mappingPersistence.retrieveMappingDetailsForProject as jest.Mock).mockResolvedValue(mockMappingDetails);
    (mappingPersistence.retrieveMappingValidationResultsForProject as jest.Mock).mockResolvedValue(mockValidationResults);
    (mappingPersistence.retrieveMigrationRiskAssessmentsForProject as jest.Mock).mockResolvedValue(mockRiskAssessments);

    const result = await searchMappingsByCondition({
      userId: "user-001",
      projectId: "proj-migration-2024",
      targetSystemId: "target-oracle-billing",
      pageNumber: 2,
      pageSize: 10,
    });

    expect(result.mappingTableRows).toHaveLength(10);
    expect(result.totalRowCount).toBe(25);
    expect(result.pageNumber).toBe(2);
    expect(result.pageSize).toBe(10);
    expect(result.filteredRowCount).toBe(10);

    expect(result.mappingTableRows[0].mappingDetailId).toBe("map-011");
    expect(result.mappingTableRows[9].mappingDetailId).toBe("map-020");
  });
});
