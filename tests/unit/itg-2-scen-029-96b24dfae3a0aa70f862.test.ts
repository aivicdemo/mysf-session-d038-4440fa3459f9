import { runTx12Imp1Agent, Tx12Imp1AiClient } from "../../src/agents/tx-12-imp-1/orchestrator";
import * as projectContextResolver from "../../src/logic/project-context-resolver";
import * as authenticationAuthorization from "../../src/logic/authentication-authorization";
import * as mappingGenerationService from "../../src/logic/mapping-generation-service";
import * as mappingValidationService from "../../src/logic/mapping-validation-service";
import * as riskAssessmentService from "../../src/logic/risk-assessment-service";
import * as referenceRelationshipAnalyzer from "../../src/logic/reference-relationship-analyzer";
import * as calculationLogicMapper from "../../src/logic/calculation-logic-mapper";
import * as mappingPersistence from "../../src/logic/mapping-persistence";

jest.mock("../../src/logic/project-context-resolver");
jest.mock("../../src/logic/authentication-authorization");
jest.mock("../../src/logic/mapping-generation-service");
jest.mock("../../src/logic/mapping-validation-service");
jest.mock("../../src/logic/risk-assessment-service");
jest.mock("../../src/logic/reference-relationship-analyzer");
jest.mock("../../src/logic/calculation-logic-mapper");
jest.mock("../../src/logic/mapping-persistence");

describe("SCEN-029: マッピング詳細・検証結果・リスク評価の保存に失敗した場合", () => {
  let mockAiClient: jest.Mocked<Tx12Imp1AiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAiClient = {} as jest.Mocked<Tx12Imp1AiClient>;
  });

  it("DataPersistenceFailedException が発生し、定められたエラーメッセージが返される", async () => {
    const projectId = "proj-2024-001";
    const targetSystemId = "target-sys-oracle-01";
    const userId = "user-12345";
    const existingProcessDefinitions = [
      {
        processName: "請求書生成プロセス",
        processDescription: "Salesforce商談から請求書を自動生成",
        workflowSteps: [
          {
            stepName: "商談確定チェック",
            stepLogic: "Amount > 0 AND StageName = 'Closed Won'",
          },
          {
            stepName: "請求書作成",
            stepLogic: "CreateInvoiceRecord()",
          },
        ],
        calculationLogics: [
          {
            logicName: "請求額計算",
            logicExpression: "SUM(商談商品.UnitPrice * 商談商品.Quantity)",
          },
        ],
      },
    ];
    const partnerConfirmationDetails = [
      {
        confirmationTopic: "請求書フロー移行方針",
        confirmedContent:
          "Oracle標準の請求管理モジュールを使用。Salesforceカスタムロジックはストアドプロシージャで実装",
        confirmationDate: "2024-01-15",
        confirmedBy: "partner-contact-001",
      },
    ];
    const executionTimestamp = "2024-01-20T10:30:00Z";

    const projectContextValue = {
      projectId: "proj-2024-001",
      targetSystemId: "target-sys-oracle-01",
      isValid: true,
      context: {
        projectName: "Salesforce移行プロジェクト",
        migrationPhase: "detailed-mapping",
      },
    };

    const authenticationValue = {
      userId: "user-12345",
      authenticationStatus: "authenticated",
      permissionStatus: "authorized",
      permissions: ["mapping:create", "mapping:validate", "risk:assess"],
    };

    const mappingTableValue = {
      mappingTableId: "map-table-001",
      mappings: [
        {
          mappingId: "map-001",
          sourceField: "Invoice__c.Amount",
          targetField: "AR_INVOICES.INVOICE_AMOUNT",
          mappingStatus: "mapped",
        },
      ],
    };

    const validationResultsValue = {
      validationResults: [
        {
          mappingId: "map-001",
          gapClassification: "functional-gap",
          gapScore: 3.5,
          validationStatus: "needs-review",
        },
      ],
      totalGapsDetected: 1,
    };

    const riskAssessmentValue = {
      riskAssessments: [
        {
          riskId: "risk-001",
          riskClassification: "calculation-logic-mismatch",
          riskScore: 4.2,
          mitigationStrategy: "ストアドプロシージャでの計算ロジック再実装",
        },
      ],
      overallRiskLevel: "medium",
    };

    const relationshipAnalysisValue = {
      referenceRelationships: [
        {
          sourceObject: "Invoice__c",
          targetObject: "InvoiceLineItem__c",
          relationshipType: "master-detail",
          circulardependency: false,
        },
      ],
    };

    const calculationMappingsValue = {
      calculationMappings: [
        {
          sourceLogic: "請求額計算",
          targetImplementation: "Oracle Stored Procedure PKG_INVOICE.CALC_INVOICE_TOTAL",
          mappingStatus: "mapped",
        },
      ],
    };

    const persistenceError = new Error("DataPersistenceFailedException");
    (persistenceError as any).name = "DataPersistenceFailedException";

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
      .mockRejectedValue(persistenceError);

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
      "データの保存に失敗しました。システム管理者に連絡してください。"
    );
    expect(result.mappingTableId).toBeNull();
    expect(result.auditTrailId).toBeNull();
    expect(
      result.validationResults === undefined ||
        result.validationResults.length === 0 ||
        !result.validationResults.some(
          (r) =>
            r.mappingId === "map-001" &&
            r.gapClassification === "functional-gap"
        )
    ).toBe(true);
    expect(
      result.riskAssessments === undefined ||
        result.riskAssessments.length === 0 ||
        !result.riskAssessments.some((r) => r.riskId === "risk-001")
    ).toBe(true);
    expect(
      result.technicalSpecification.content === null ||
        result.technicalSpecification.content === ""
    ).toBe(true);
    expect(
      result.operationGuideInfo.completionPercentage === 0 ||
        result.operationGuideInfo.completionPercentage < 50
    ).toBe(true);
  });
});
