import { analyzeReferenceRelationships } from '../../src/logic/reference-relationship-analyzer';
import type {
  AnalyzeReferenceRelationshipsInput,
  AnalyzeReferenceRelationshipsOutput,
  CircularDependency,
  CalculationLogicDependency,
  TargetSystemCompatibilityResult,
  AnalysisMetadata,
  ExtractReferenceMetadataOutput,
  BuildReferenceGraphInput,
  DetectCircularDependenciesInput,
  EvaluateTargetSystemCompatibilityInput,
} from '../../src/logic/reference-relationship-analyzer';
import type { ReferenceGraph } from '../../src/logic/mapping-generation-service';
import * as mappingPersistence from '../../src/logic/mapping-persistence';
import * as referenceAnalyzer from '../../src/logic/reference-relationship-analyzer';

jest.mock('../../src/logic/mapping-persistence');

describe('SCEN-116: analyzeReferenceRelationships - 正常系', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('複数のカスタムオブジェクトと参照関係が存在し、循環依存がなく、移行対象システムと互換性がある場合、参照グラフと互換性判定結果を返す', async () => {
    const projectId = 'proj-invoice-migration-001';
    const targetSystemId = 'target-oracle-erp-001';
    const executedAt = new Date('2026-10-07T10:30:00.000Z');
    const executedByUserId = 'user-migration-admin-001';

    // Mock retrieveMappingDetailsForProject
    (mappingPersistence.retrieveMappingDetailsForProject as jest.Mock).mockResolvedValueOnce({
      customObjectDefinitions: [
        {
          objectId: 'obj-invoice-001',
          objectName: 'Invoice__c',
          objectLabel: '請求書',
          fields: [
            { fieldId: 'fld-inv-num', fieldName: 'InvoiceNumber__c', dataType: 'Text', required: true },
            { fieldId: 'fld-inv-date', fieldName: 'InvoiceDate__c', dataType: 'Date', required: true },
            { fieldId: 'fld-inv-total', fieldName: 'TotalAmount__c', dataType: 'Currency', required: false, isCalculated: true },
          ],
        },
        {
          objectId: 'obj-invoice-line-001',
          objectName: 'InvoiceLine__c',
          objectLabel: '請求明細',
          fields: [
            { fieldId: 'fld-line-invoice-ref', fieldName: 'Invoice__c', dataType: 'Lookup', required: true, referenceTo: 'Invoice__c' },
            { fieldId: 'fld-line-amount', fieldName: 'LineAmount__c', dataType: 'Currency', required: true },
          ],
        },
      ],
      objectReferences: [
        {
          relationshipId: 'rel-inv-line-001',
          sourceObject: 'InvoiceLine__c',
          targetObject: 'Invoice__c',
          referenceField: 'Invoice__c',
          cardinality: 'many-to-one',
          deleteAction: 'cascade',
          relationshipType: 'lookup',
        },
      ],
      calculationLogicDefinitions: [
        {
          logicId: 'calc-inv-total-001',
          objectName: 'Invoice__c',
          logicType: 'rollup_summary',
          fieldName: 'TotalAmount__c',
          dependsOn: ['InvoiceLine__c.LineAmount__c'],
          formula: 'SUM(InvoiceLine__c.LineAmount__c)',
        },
      ],
    });

    // Mock retrieveMappingDetailsByTargetSystem
    (mappingPersistence.retrieveMappingDetailsByTargetSystem as jest.Mock).mockResolvedValueOnce({
      targetSystemId: 'target-oracle-erp-001',
      standardFeatures: [
        {
          featureId: 'feat-oracle-lookup',
          featureName: 'Foreign Key Reference',
          supportedCardinality: ['one-to-many', 'many-to-one'],
          supportsCalculation: true,
          supportsRollupSummary: true,
        },
      ],
    });


    const input: AnalyzeReferenceRelationshipsInput = {
      projectId,
      targetSystemId,
      includeCalculationLogicDependencies: true,
      executedAt,
      executedByUserId,
    };

    const result = await analyzeReferenceRelationships(input);

    // Verify retrieveMappingDetailsForProject was called
    expect(mappingPersistence.retrieveMappingDetailsForProject).toHaveBeenCalledWith(projectId);

    // Verify retrieveMappingDetailsByTargetSystem was called
    expect(mappingPersistence.retrieveMappingDetailsByTargetSystem).toHaveBeenCalledWith(targetSystemId);

    // Verify output structure and content
    expect(result).toBeDefined();
    expect(result.referenceGraph).toBeDefined();
    expect(result.referenceGraph.nodes).toHaveLength(2);
    expect(result.referenceGraph.edges).toHaveLength(1);

    expect(result.circularDependencies).toEqual([]);

    expect(result.calculationLogicDependencies).toBeDefined();

    expect(result.targetSystemCompatibility).toBeDefined();
    expect(result.targetSystemCompatibility.overallCompatibility).toBeDefined();
    expect(result.targetSystemCompatibility.compatibleReferences).toBeDefined();
    expect(result.targetSystemCompatibility.incompatibleReferences).toEqual([]);
    expect(result.targetSystemCompatibility.recommendations).toBeDefined();

    expect(result.analysisMetadata).toBeDefined();
    expect(result.analysisMetadata.executedAt).toEqual(executedAt);
    expect(result.analysisMetadata.executedByUserId).toEqual(executedByUserId);
    expect(result.analysisMetadata.processingTimeMs).toBeDefined();
    expect(result.analysisMetadata.analysisVersion).toBeDefined();
  });
});
