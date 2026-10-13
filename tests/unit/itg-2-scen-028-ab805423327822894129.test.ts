import { runTx12Imp1Agent, Tx12Imp1AiClient } from "../../src/agents/tx-12-imp-1/orchestrator";
import * as projectContextResolver from "../../src/logic/project-context-resolver";
import * as authenticationAuthorization from "../../src/logic/authentication-authorization";
import * as mappingGenerationService from "../../src/logic/mapping-generation-service";
import * as mappingValidationService from "../../src/logic/mapping-validation-service";
import * as riskAssessmentService from "../../src/logic/risk-assessment-service";
import * as referenceRelationshipAnalyzer from "../../src/logic/reference-relationship-analyzer";
import * as calculationLogicMapper from "../../src/logic/calculation-logic-mapper";
import * as mappingPersistence from "../../src/logic/mapping-persistence";
import * as auditTrailService from "../../src/logic/audit-trail-service";

jest.mock("../../src/logic/project-context-resolver");
jest.mock("../../src/logic/authentication-authorization");
jest.mock("../../src/logic/mapping-generation-service");
jest.mock("../../src/logic/mapping-validation-service");
jest.mock("../../src/logic/risk-assessment-service");
jest.mock("../../src/logic/reference-relationship-analyzer");
jest.mock("../../src/logic/calculation-logic-mapper");
jest.mock("../../src/logic/mapping-persistence");
jest.mock("../../src/logic/audit-trail-service");

describe("SCEN-028: 操作履歴の記録に失敗した場合", () => {
  let mockAiClient: jest.Mocked<Tx12Imp1AiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAiClient = {} as jest.Mocked<Tx12Imp1AiClient>;
  });

  it("AuditTrailRecordingFailedException が発生し、定められたエラーメッセージが返される", async () => {
    const projectId = "proj-20250107-001";
    const targetSystemId = "tgt-oracle-erp-001";
    const userId = "user-migration-lead-001";
    const existingProcessDefinitions = [
      {
        processName: "請求書作成ワークフロー",
        processDescription: "商談から請求書を自動生成するプロセス",
        workflowSteps: [
          {
            stepName: "請求書レコード作成",
            stepLogic: "商談レコードから請求書カスタムオブジェクトを生成",
          },
        ],
        calculationLogics: [
          {
            logicName: "請求金額計算",
            logicExpression: "SUM(請求明細.単価 * 請求明細.数量)",
          },
        ],
      },
    ];
    const partnerConfirmationDetails = [
      {
        confirmationTopic: "請求書オブジェクト仕様",
        confirmedContent: "Oracle ERP標準請求テーブルとのマッピング確認完了",
        confirmationDate: "2025-01-07T10:00:00Z",
        confirmedBy: "partner-finance-lead-001",
      },
    ];
    const executionTimestamp = "2025-01-07T14:30:00Z";

    const projectContextValue = {
      projectId: "proj-20250107-001",
      targetSystemId: "tgt-oracle-erp-001",
      projectStatus: "active",
      accessLevel: "full",
    };

    const authenticationValue = {
      userId: "user-migration-lead-001",
      authenticated: true,
      hasPermission: true,
      permissionScope: "mapping_generation",
    };

    const mappingTableValue = {
      mappingTableId: "mapping-001",
      objectDefinitions: [
        {
          objectName: "Invoice__c",
          fields: ["Id", "Name", "Amount__c", "DueDate__c"],
        },
      ],
    };

    const validationResultsValue = {
      validationResults: [
        {
          mappingId: "map-001",
          gapClassification: "MINOR",
          gapScore: 0.15,
          validationStatus: "PASSED",
        },
      ],
    };

    const riskAssessmentValue = {
      riskAssessments: [
        {
          riskId: "risk-001",
          riskClassification: "MEDIUM",
          riskScore: 0.35,
          mitigationStrategy: "請求明細計算ロジックの段階的マイグレーション",
        },
      ],
    };

    const relationshipAnalysisValue = {
      relationshipAnalysis: {
        dependencies: [
          "Opportunity -> Invoice__c",
          "Invoice__c -> InvoiceLineItem__c",
        ],
        circularDependencies: [],
      },
    };

    const calculationMappingsValue = {
      calculationMappings: [
        {
          sourceLogic: "Invoice Amount = SUM(Line Item Amount)",
          targetImplementation: "Oracle COMPUTED COLUMN",
        },
      ],
    };

    const saveMappingDetailsValue = {
      success: true,
      savedId: "mapping-persistence-001",
    };

    const saveMappingValidationResultValue = {
      success: true,
      savedId: "validation-persistence-001",
    };

    const saveMigrationRiskAssessmentValue = {
      success: true,
      savedId: "risk-persistence-001",
    };

    const auditTrailError = new Error("AuditTrailRecordingFailedException");
    (auditTrailError as any).name = "AuditTrailRecordingFailedException";
    (auditTrailError as any).message =
      "操作履歴の記録に失敗しました。システム管理者に連絡してください。";

    jest
      .spyOn(projectContextResolver, "resolveProjectContext")
      .mockResolvedValue(projectContextValue as any);
    jest
      .spyOn(authenticationAuthorization, "verifyUserAuthenticationAndAuthorization")
      .mockResolvedValue(authenticationValue as any);
    jest
      .spyOn(mappingGenerationService, "generateMappingTable")
      .mockResolvedValue(mappingTableValue as any);
    jest
      .spyOn(mappingValidationService, "validateMappingAndClassifyGaps")
      .mockResolvedValue(validationResultsValue as any);
    jest
      .spyOn(riskAssessmentService, "assessMigrationRisksFromMapping")
      .mockResolvedValue(riskAssessmentValue as any);
    jest
      .spyOn(referenceRelationshipAnalyzer, "analyzeReferenceRelationships")
      .mockResolvedValue(relationshipAnalysisValue as any);
    jest
      .spyOn(calculationLogicMapper, "mapCalculationLogicsToTargetSystem")
      .mockResolvedValue(calculationMappingsValue as any);
    jest
      .spyOn(mappingPersistence, "saveMappingDetails")
      .mockResolvedValue(saveMappingDetailsValue as any);
    jest
      .spyOn(mappingPersistence, "saveMappingValidationResult")
      .mockResolvedValue(saveMappingValidationResultValue as any);
    jest
      .spyOn(mappingPersistence, "saveMigrationRiskAssessment")
      .mockResolvedValue(saveMigrationRiskAssessmentValue as any);
    jest
      .spyOn(auditTrailService, "recordMappingGenerationAuditTrail")
      .mockRejectedValue(auditTrailError);

    const result = await runTx12Imp1Agent(
      {
        projectId,
        targetSystemId,
        userId,
        existingProcessDefinitions,
        partnerConfirmationDetails,
        executionTimestamp,
      },
      mockAiClient
    );

    expect(result.status).toBe("failure");
    expect(result.errorMessage).toBe(
      "操作履歴の記録に失敗しました。システム管理者に連絡してください。"
    );
    expect(result.auditTrailId).toBeNull();
    expect(result.mappingTableId).toBe("mapping-001");
    expect(result.validationResults).toEqual([
      {
        mappingId: "map-001",
        gapClassification: "MINOR",
        gapScore: 0.15,
        validationStatus: "PASSED",
      },
    ]);
    expect(result.riskAssessments).toEqual([
      {
        riskId: "risk-001",
        riskClassification: "MEDIUM",
        riskScore: 0.35,
        mitigationStrategy: "請求明細計算ロジックの段階的マイグレーション",
      },
    ]);
    expect(result.technicalSpecification).toHaveProperty("specificationId");
    expect(result.technicalSpecification).toHaveProperty("content");
    expect(result.technicalSpecification).toHaveProperty("generatedAt");
    expect(result.operationGuideInfo).toHaveProperty("guideId");
    expect(result.operationGuideInfo).toHaveProperty("requiredSections");
    expect(result.operationGuideInfo).toHaveProperty("completionPercentage");
  });
});
