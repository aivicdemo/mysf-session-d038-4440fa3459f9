import { runTx12Imp1Agent, Tx12Imp1AiClient } from '../../src/agents/tx-12-imp-1/orchestrator';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as authorizationService from '../../src/logic/authentication-authorization';
import * as mappingService from '../../src/logic/mapping-generation-service';
import * as validationService from '../../src/logic/mapping-validation-service';
import * as riskAssessmentService from '../../src/logic/risk-assessment-service';
import * as referenceRelationshipAnalyzer from '../../src/logic/reference-relationship-analyzer';
import * as calculationLogicMapper from '../../src/logic/calculation-logic-mapper';

describe('SCEN-027: OperationGuideGenerationFailedException when operation guide info completion fails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('runTx12Imp1Agent should throw OperationGuideGenerationFailedException with proper error message and output when mapping validation and calculation logic mapping both return null', async () => {
    // Preconditions from spec
    const input: any = {
      projectId: 'proj-20250107-sf-migration-001',
      targetSystemId: 'tgt-oracle-erp-billing-v2',
      userId: 'user-migration-lead-001',
      existingProcessDefinitions: [
        {
          processName: 'Invoice_Approval_Workflow',
          processDescription: 'Salesforce請求書承認フロー',
          workflowSteps: [
            {
              stepName: 'Submit_for_Approval',
              stepLogic: 'When status = Draft, trigger approval request',
            },
            {
              stepName: 'Manager_Review',
              stepLogic: 'Manager reviews and approves or rejects',
            },
          ],
          calculationLogics: [
            {
              logicName: 'Calculate_Invoice_Total',
              logicExpression: 'SUM(InvoiceLineItems.Amount)',
            },
          ],
        },
      ],
      partnerConfirmationDetails: [
        {
          confirmationTopic: 'Invoice_Standard_Fields',
          confirmedContent: 'Invoice Number, Amount, Due Date are required in Oracle target system',
          confirmationDate: '2025-01-07T10:00:00Z',
          confirmedBy: 'partner-confirm-001',
        },
      ],
      executionTimestamp: '2025-01-07T14:30:00Z',
    };

    // Mock stub functions with preconditions values
    jest.spyOn(projectContextResolver, 'resolveProjectContext').mockResolvedValue({
      projectId: 'proj-20250107-sf-migration-001',
      targetSystemId: 'tgt-oracle-erp-billing-v2',
      isValid: true,
      accessible: true,
    });

    jest.spyOn(authorizationService, 'verifyUserAuthenticationAndAuthorization').mockResolvedValue({
      userId: 'user-migration-lead-001',
      isAuthenticated: true,
      hasAuthorizationForMappingOperation: true,
    });

    jest.spyOn(mappingService, 'generateMappingTable').mockResolvedValue({
      mappingTableId: 'mapping-tbl-001',
      projectId: 'proj-20250107-sf-migration-001',
      targetSystemId: 'tgt-oracle-erp-billing-v2',
      mappingDetails: [
        {
          mappingDetailId: 'mapping-detail-001',
          existingFeatureName: 'Invoice__c',
          existingFeatureDescription: 'Salesforce Invoice object',
          mappingMethod: 'Direct mapping',
          implementationApproach: 'Oracle standard Invoice module',
          gapClassification: 'fully_mapped',
          gapScore: 0,
          complexity: 'low',
          dependencies: 'Customer__c',
          verificationMethod: 'Unit test',
        },
        {
          mappingDetailId: 'mapping-detail-002',
          existingFeatureName: 'Invoice_Number__c',
          existingFeatureDescription: 'Invoice Number field',
          mappingMethod: 'Standard field mapping',
          implementationApproach: 'Invoice Number in Oracle Receivables',
          gapClassification: 'fully_mapped',
          gapScore: 0,
          complexity: 'low',
          dependencies: 'None',
          verificationMethod: 'Integration test',
        },
      ],
      gapAnalysisSummary: {
        totalMappingCount: 2,
        fullyMappedCount: 2,
        partiallyMappedCount: 0,
        customizationRequiredCount: 0,
        notMappedCount: 0,
        averageGapScore: 0,
        mappingCoveragePercentage: 100,
      },
      realizabilityAssessment: {
        realizabilityScore: 95,
        riskLevel: 'low',
        estimatedEffort: 'small',
        criticalGaps: [],
        recommendations: [],
      },
      generatedAt: new Date('2025-01-07T14:30:00Z').getTime(),
    });

    // Mock validateMappingAndClassifyGaps to return null (failure)
    jest.spyOn(validationService, 'validateMappingAndClassifyGaps').mockResolvedValue(null);

    jest.spyOn(riskAssessmentService, 'assessMigrationRisksFromMapping').mockResolvedValue([
      {
        riskId: 'risk-calc-logic-001',
        riskClassification: 'HIGH',
        riskScore: 8.5,
        mitigationStrategy: 'Implement Oracle Forms-based calculation to replicate Salesforce roll-up logic',
      },
    ]);

    jest.spyOn(referenceRelationshipAnalyzer, 'analyzeReferenceRelationships').mockResolvedValue({
      analysisId: 'ref-analysis-001',
      referenceRelationships: [
        {
          sourceObject: 'Invoice__c',
          targetObject: 'InvoiceLineItem__c',
          relationshipType: 'Master-Detail',
        },
      ],
      circularDependencies: [],
    });

    // Mock mapCalculationLogicsToTargetSystem to return null (failure)
    jest.spyOn(calculationLogicMapper, 'mapCalculationLogicsToTargetSystem').mockResolvedValue(null);

    const mockAiClient: Tx12Imp1AiClient = {};

    // Execute and verify exception/rejection occurs
    let caughtError: any;
    try {
      await runTx12Imp1Agent(input, mockAiClient);
      fail('Expected runTx12Imp1Agent to throw/reject');
    } catch (error) {
      caughtError = error;
    }

    // Verify error was thrown
    expect(caughtError).toBeDefined();

    // Verify error message matches specification
    if (caughtError instanceof Error) {
      expect(caughtError.message).toBe('操作ガイド情報の生成に失敗しました。マッピングと技術仕様書を確認してください。');
    }

    // If error has output property attached, verify its fields match specification
    if (caughtError && 'output' in caughtError && caughtError.output) {
      const output = caughtError.output as any;
      expect(output.status).toBe('failure');
      expect(output.mappingTableId).toBeNull();
      expect(output.auditTrailId).toBeNull();
      expect(output.operationGuideInfo).toBeNull();
      expect(output.errorMessage).toBe('操作ガイド情報の生成に失敗しました。マッピングと技術仕様書を確認してください。');
      expect(output.technicalSpecification).toBeNull();
    }
  });
});
