import { searchMappingsByCondition } from "../../src/logic/mapping-query-service";
import * as mappingAuth from "../../src/logic/authentication-authorization";
import * as projectResolver from "../../src/logic/project-context-resolver";
import * as mappingPersistence from "../../src/logic/mapping-persistence";

jest.mock("../../src/logic/authentication-authorization");
jest.mock("../../src/logic/project-context-resolver");
jest.mock("../../src/logic/mapping-persistence");

describe("SCEN-235: searchMappingsByCondition with no filter conditions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return all mapping records formatted for display, sorted by priority ascending, with pagination", async () => {
    const input = {
      userId: "user-001",
      projectId: "project-migration-2024",
      targetSystemId: "oracle-erp-001",
      existingFunctionName: undefined,
      mappingStatus: undefined,
      gapClassification: undefined,
      riskLevel: undefined,
      complexity: undefined,
      validationStatus: undefined,
      priority: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: 1,
      pageSize: 20,
    };

    const mockAuthResult = {
      isAuthorized: true,
      userId: "user-001",
      operationType: "search_mapping",
      projectId: "project-migration-2024",
    };

    const mockProjectContext = {
      projectId: "project-migration-2024",
      targetSystemId: "oracle-erp-001",
      userId: "user-001",
      userRole: "admin",
      isContextValid: true,
    };

    const mockMappingDetails = [
      {
        mappingDetailId: "map-001",
        projectId: "project-migration-2024",
        targetSystemId: "oracle-erp-001",
        existingFunctionName: "請求書作成",
        mappingTargetObjectId: "AR_INVOICES",
        mappingMethod: "Field mapping",
        migrationStatus: "進行中",
        priority: 8,
        complexity: "中",
        verificationStatus: "verified",
        createdAt: "2024-01-01T00:00:00Z",
        createdBy: "system",
        updatedAt: "2024-01-01T00:00:00Z",
        updatedBy: "system",
      },
      {
        mappingDetailId: "map-002",
        projectId: "project-migration-2024",
        targetSystemId: "oracle-erp-001",
        existingFunctionName: "請求明細管理",
        mappingTargetObjectId: "AR_INVOICE_LINES",
        mappingMethod: "Field mapping",
        migrationStatus: "計画中",
        priority: 5,
        complexity: "低",
        verificationStatus: "verified",
        createdAt: "2024-01-01T00:00:00Z",
        createdBy: "system",
        updatedAt: "2024-01-01T00:00:00Z",
        updatedBy: "system",
      },
      {
        mappingDetailId: "map-003",
        projectId: "project-migration-2024",
        targetSystemId: "oracle-erp-001",
        existingFunctionName: "承認フロー",
        mappingTargetObjectId: "APPROVAL_FLOW",
        mappingMethod: "Custom implementation",
        migrationStatus: "完了",
        priority: 9,
        complexity: "高",
        verificationStatus: "verified",
        createdAt: "2024-01-01T00:00:00Z",
        createdBy: "system",
        updatedAt: "2024-01-01T00:00:00Z",
        updatedBy: "system",
      },
      {
        mappingDetailId: "map-004",
        projectId: "project-migration-2024",
        targetSystemId: "oracle-erp-001",
        existingFunctionName: "請求書レポート",
        mappingTargetObjectId: "REPORT",
        mappingMethod: "Field mapping",
        migrationStatus: "進行中",
        priority: 3,
        complexity: "中",
        verificationStatus: "verified",
        createdAt: "2024-01-01T00:00:00Z",
        createdBy: "system",
        updatedAt: "2024-01-01T00:00:00Z",
        updatedBy: "system",
      },
    ];

    const mockValidationResults = [
      {
        validationResultId: "val-001",
        projectId: "project-migration-2024",
        mappingDetailId: "map-001",
        validationStatus: "passed",
        gapClassification: "完全対応",
        gapScore: 0,
        riskLevel: "低",
        validatorId: "validator-001",
        validationTimestamp: "2024-01-01T00:00:00Z",
        createdAt: "2024-01-01T00:00:00Z",
        createdBy: "system",
        updatedAt: "2024-01-01T00:00:00Z",
        updatedBy: "system",
      },
      {
        validationResultId: "val-002",
        projectId: "project-migration-2024",
        mappingDetailId: "map-002",
        validationStatus: "passed",
        gapClassification: "部分対応",
        gapScore: 5,
        riskLevel: "中",
        validatorId: "validator-001",
        validationTimestamp: "2024-01-01T00:00:00Z",
        createdAt: "2024-01-01T00:00:00Z",
        createdBy: "system",
        updatedAt: "2024-01-01T00:00:00Z",
        updatedBy: "system",
      },
      {
        validationResultId: "val-003",
        projectId: "project-migration-2024",
        mappingDetailId: "map-003",
        validationStatus: "passed",
        gapClassification: "カスタマイズ必要",
        gapScore: 8,
        riskLevel: "高",
        validatorId: "validator-001",
        validationTimestamp: "2024-01-01T00:00:00Z",
        createdAt: "2024-01-01T00:00:00Z",
        createdBy: "system",
        updatedAt: "2024-01-01T00:00:00Z",
        updatedBy: "system",
      },
      {
        validationResultId: "val-004",
        projectId: "project-migration-2024",
        mappingDetailId: "map-004",
        validationStatus: "passed",
        gapClassification: "非対応",
        gapScore: 10,
        riskLevel: "中",
        validatorId: "validator-001",
        validationTimestamp: "2024-01-01T00:00:00Z",
        createdAt: "2024-01-01T00:00:00Z",
        createdBy: "system",
        updatedAt: "2024-01-01T00:00:00Z",
        updatedBy: "system",
      },
    ];

    const mockRiskAssessments = [
      {
        riskAssessmentId: "risk-001",
        projectId: "project-migration-2024",
        riskClassification: "data_migration",
        riskItemName: "Invoice mapping risk",
        riskEvaluationScore: 3,
        occurrencePossibilityLevel: "low",
        impactLevel: "low",
        remediationApproach: "data validation",
        assessorId: "assessor-001",
        assessmentTimestamp: "2024-01-01T00:00:00Z",
        createdAt: "2024-01-01T00:00:00Z",
        createdBy: "system",
        updatedAt: "2024-01-01T00:00:00Z",
        updatedBy: "system",
      },
      {
        riskAssessmentId: "risk-002",
        projectId: "project-migration-2024",
        riskClassification: "calculation_logic",
        riskItemName: "Line item risk",
        riskEvaluationScore: 5,
        occurrencePossibilityLevel: "medium",
        impactLevel: "medium",
        remediationApproach: "logic review",
        assessorId: "assessor-001",
        assessmentTimestamp: "2024-01-01T00:00:00Z",
        createdAt: "2024-01-01T00:00:00Z",
        createdBy: "system",
        updatedAt: "2024-01-01T00:00:00Z",
        updatedBy: "system",
      },
      {
        riskAssessmentId: "risk-003",
        projectId: "project-migration-2024",
        riskClassification: "workflow",
        riskItemName: "Approval flow risk",
        riskEvaluationScore: 7,
        occurrencePossibilityLevel: "high",
        impactLevel: "high",
        remediationApproach: "custom implementation",
        assessorId: "assessor-001",
        assessmentTimestamp: "2024-01-01T00:00:00Z",
        createdAt: "2024-01-01T00:00:00Z",
        createdBy: "system",
        updatedAt: "2024-01-01T00:00:00Z",
        updatedBy: "system",
      },
      {
        riskAssessmentId: "risk-004",
        projectId: "project-migration-2024",
        riskClassification: "reporting",
        riskItemName: "Report mapping risk",
        riskEvaluationScore: 4,
        occurrencePossibilityLevel: "medium",
        impactLevel: "low",
        remediationApproach: "report validation",
        assessorId: "assessor-001",
        assessmentTimestamp: "2024-01-01T00:00:00Z",
        createdAt: "2024-01-01T00:00:00Z",
        createdBy: "system",
        updatedAt: "2024-01-01T00:00:00Z",
        updatedBy: "system",
      },
    ];

    (mappingAuth.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue(mockAuthResult);
    (projectResolver.resolveProjectContext as jest.Mock).mockResolvedValue(mockProjectContext);
    (mappingPersistence.retrieveMappingDetailsForProject as jest.Mock).mockResolvedValue(mockMappingDetails);
    (mappingPersistence.retrieveMappingValidationResultsForProject as jest.Mock).mockResolvedValue(
      mockValidationResults
    );
    (mappingPersistence.retrieveMigrationRiskAssessmentsForProject as jest.Mock).mockResolvedValue(
      mockRiskAssessments
    );

    const result = await searchMappingsByCondition(input);

    expect(result).toBeDefined();
    expect(result.mappingTableRows).toHaveLength(4);
    expect(result.totalRowCount).toBe(4);
    expect(result.filteredRowCount).toBe(4);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(20);

    // Verify sorting by priority ascending (default sort)
    const priorities = result.mappingTableRows.map((row) => row.priority);
    expect(priorities).toEqual([3, 5, 8, 9]);

    // Verify the specific records in order
    expect(result.mappingTableRows[0].mappingDetailId).toBe("map-004");
    expect(result.mappingTableRows[0].existingFunctionName).toBe("請求書レポート");
    expect(result.mappingTableRows[0].priority).toBe(3);
    expect(result.mappingTableRows[0].gapClassification).toBe("非対応");
    expect(result.mappingTableRows[0].riskLevel).toBe("中");

    expect(result.mappingTableRows[1].mappingDetailId).toBe("map-002");
    expect(result.mappingTableRows[1].existingFunctionName).toBe("請求明細管理");
    expect(result.mappingTableRows[1].priority).toBe(5);
    expect(result.mappingTableRows[1].gapClassification).toBe("部分対応");
    expect(result.mappingTableRows[1].riskLevel).toBe("中");

    expect(result.mappingTableRows[2].mappingDetailId).toBe("map-001");
    expect(result.mappingTableRows[2].existingFunctionName).toBe("請求書作成");
    expect(result.mappingTableRows[2].priority).toBe(8);
    expect(result.mappingTableRows[2].gapClassification).toBe("完全対応");
    expect(result.mappingTableRows[2].riskLevel).toBe("低");

    expect(result.mappingTableRows[3].mappingDetailId).toBe("map-003");
    expect(result.mappingTableRows[3].existingFunctionName).toBe("承認フロー");
    expect(result.mappingTableRows[3].priority).toBe(9);
    expect(result.mappingTableRows[3].gapClassification).toBe("カスタマイズ必要");
    expect(result.mappingTableRows[3].riskLevel).toBe("高");
  });
});
