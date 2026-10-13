import { queryMappingTableForDisplay } from "../../src/logic/mapping-query-service";
import * as mappingAuth from "../../src/logic/authentication-authorization";
import * as projectResolver from "../../src/logic/project-context-resolver";
import * as mappingPersistence from "../../src/logic/mapping-persistence";

jest.mock("../../src/logic/authentication-authorization");
jest.mock("../../src/logic/project-context-resolver");
jest.mock("../../src/logic/mapping-persistence");

describe("SCEN-231: queryMappingTableForDisplay with valid user and project", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return integrated mapping table data with statistics", async () => {
    const input = {
      userId: "user-001",
      projectId: "proj-2024-001",
      targetSystemId: "system-oracle-erp",
    };

    const mockAuthResult = {
      isAuthorized: true,
      userId: "user-001",
      operationType: "read_mapping",
      projectId: "proj-2024-001",
    };

    const mockProjectContext = {
      projectId: "proj-2024-001",
      targetSystemId: "system-oracle-erp",
      userId: "user-001",
      userRole: "admin",
      isContextValid: true,
    };

    const mockMappingDetails = [
      {
        mappingDetailId: "map-001",
        projectId: "proj-2024-001",
        targetSystemId: "system-oracle-erp",
        existingFunctionName: "Invoice__c",
        mappingTargetObjectId: "AR_INVOICES",
        mappingMethod: "Field mapping",
        migrationStatus: "confirmed",
        priority: 1,
        complexity: "low",
        verificationStatus: "verified",
        createdAt: "2024-01-01T00:00:00Z",
        createdBy: "system",
        updatedAt: "2024-01-01T00:00:00Z",
        updatedBy: "system",
      },
      {
        mappingDetailId: "map-002",
        projectId: "proj-2024-001",
        targetSystemId: "system-oracle-erp",
        existingFunctionName: "Invoice_Amount__c",
        mappingTargetObjectId: "INVOICE_AMOUNT",
        mappingMethod: "Field mapping",
        migrationStatus: "confirmed",
        priority: 2,
        complexity: "low",
        verificationStatus: "verified",
        createdAt: "2024-01-01T00:00:00Z",
        createdBy: "system",
        updatedAt: "2024-01-01T00:00:00Z",
        updatedBy: "system",
      },
      {
        mappingDetailId: "map-003",
        projectId: "proj-2024-001",
        targetSystemId: "system-oracle-erp",
        existingFunctionName: "Invoice_Line__c",
        mappingTargetObjectId: "AR_INVOICE_LINES",
        mappingMethod: "Field mapping",
        migrationStatus: "confirmed",
        priority: 3,
        complexity: "low",
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
        projectId: "proj-2024-001",
        mappingDetailId: "map-001",
        validationStatus: "passed",
        gapClassification: "complete",
        gapScore: 0,
        riskLevel: "low",
        validatorId: "validator-001",
        validationTimestamp: "2024-01-01T00:00:00Z",
        createdAt: "2024-01-01T00:00:00Z",
        createdBy: "system",
        updatedAt: "2024-01-01T00:00:00Z",
        updatedBy: "system",
      },
      {
        validationResultId: "val-002",
        projectId: "proj-2024-001",
        mappingDetailId: "map-002",
        validationStatus: "passed",
        gapClassification: "complete",
        gapScore: 0,
        riskLevel: "medium",
        validatorId: "validator-001",
        validationTimestamp: "2024-01-01T00:00:00Z",
        createdAt: "2024-01-01T00:00:00Z",
        createdBy: "system",
        updatedAt: "2024-01-01T00:00:00Z",
        updatedBy: "system",
      },
      {
        validationResultId: "val-003",
        projectId: "proj-2024-001",
        mappingDetailId: "map-003",
        validationStatus: "passed",
        gapClassification: "complete",
        gapScore: 0,
        riskLevel: "low",
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
        projectId: "proj-2024-001",
        riskClassification: "data_migration",
        riskItemName: "Text field length limitation",
        riskEvaluationScore: 2,
        occurrencePossibilityLevel: "low",
        impactLevel: "low",
        remediationApproach: "data cleansing",
        assessorId: "assessor-001",
        assessmentTimestamp: "2024-01-01T00:00:00Z",
        createdAt: "2024-01-01T00:00:00Z",
        createdBy: "system",
        updatedAt: "2024-01-01T00:00:00Z",
        updatedBy: "system",
      },
      {
        riskAssessmentId: "risk-002",
        projectId: "proj-2024-001",
        riskClassification: "calculation_logic",
        riskItemName: "Currency conversion logic difference",
        riskEvaluationScore: 5,
        occurrencePossibilityLevel: "medium",
        impactLevel: "medium",
        remediationApproach: "conversion logic validation",
        assessorId: "assessor-001",
        assessmentTimestamp: "2024-01-01T00:00:00Z",
        createdAt: "2024-01-01T00:00:00Z",
        createdBy: "system",
        updatedAt: "2024-01-01T00:00:00Z",
        updatedBy: "system",
      },
      {
        riskAssessmentId: "risk-003",
        projectId: "proj-2024-001",
        riskClassification: "referential_integrity",
        riskItemName: "Parent-child deletion rule check",
        riskEvaluationScore: 2,
        occurrencePossibilityLevel: "low",
        impactLevel: "low",
        remediationApproach: "deletion rule documentation review",
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
    (mappingPersistence.retrieveMappingValidationResultsForProject as jest.Mock).mockResolvedValue(mockValidationResults);
    (mappingPersistence.retrieveMigrationRiskAssessmentsForProject as jest.Mock).mockResolvedValue(mockRiskAssessments);

    const result = await queryMappingTableForDisplay(input);

    expect(result).toBeDefined();
    expect(result.mappingTableRows).toHaveLength(3);
    expect(result.totalRowCount).toBe(3);
    expect(result.summaryStatistics).toBeDefined();

    const row1 = result.mappingTableRows[0];
    expect(row1.mappingDetailId).toBe("map-001");
    expect(row1.existingFunctionName).toBe("Invoice__c");

    const row2 = result.mappingTableRows[1];
    expect(row2.mappingDetailId).toBe("map-002");
    expect(row2.existingFunctionName).toBe("Invoice_Amount__c");

    const row3 = result.mappingTableRows[2];
    expect(row3.mappingDetailId).toBe("map-003");
    expect(row3.existingFunctionName).toBe("Invoice_Line__c");

    expect(mappingAuth.verifyUserAuthenticationAndAuthorization).toHaveBeenCalled();
    expect(projectResolver.resolveProjectContext).toHaveBeenCalled();
    expect(mappingPersistence.retrieveMappingDetailsForProject).toHaveBeenCalled();
    expect(mappingPersistence.retrieveMappingValidationResultsForProject).toHaveBeenCalled();
    expect(mappingPersistence.retrieveMigrationRiskAssessmentsForProject).toHaveBeenCalled();
  });
});
