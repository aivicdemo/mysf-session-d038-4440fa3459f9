import { analyzeReferenceRelationships, CircularDependencyDetected } from '../../src/logic/reference-relationship-analyzer';
import type { AnalyzeReferenceRelationshipsInput } from '../../src/logic/reference-relationship-analyzer';
import * as mappingPersistence from '../../src/logic/mapping-persistence';
import * as referenceAnalyzer from '../../src/logic/reference-relationship-analyzer';

jest.mock('../../src/logic/mapping-persistence');

describe('SCEN-119: analyzeReferenceRelationships - CircularDependencyDetectedエラー', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('オブジェクト間参照関係または計算ロジック依存関係に循環依存が存在する場合、CircularDependencyDetectedエラーを返す', async () => {
    const projectId = 'proj-sf-001';
    const targetSystemId = 'target-oracle-erp-01';
    const executedAt = new Date('2026-10-07T10:00:00.000Z');
    const executedByUserId = 'user-admin-001';

    // Mock retrieveMappingDetailsForProject
    (mappingPersistence.retrieveMappingDetailsForProject as jest.Mock).mockResolvedValueOnce({
      customObjectDefinitions: [
        {
          objectId: 'obj-invoice-001',
          objectName: 'Invoice__c',
          fields: [
            { fieldId: 'fld-inv-number', fieldName: 'InvoiceNumber__c', dataType: 'Text', isRequired: true },
            { fieldId: 'fld-inv-total', fieldName: 'TotalAmount__c', dataType: 'Currency', isRequired: false },
          ],
        },
        {
          objectId: 'obj-invoice-line-001',
          objectName: 'InvoiceLine__c',
          fields: [
            { fieldId: 'fld-line-invoice-ref', fieldName: 'InvoiceRef__c', dataType: 'Lookup', referencedObject: 'obj-invoice-001', isRequired: true },
            { fieldId: 'fld-line-amount', fieldName: 'LineAmount__c', dataType: 'Currency', isRequired: false },
          ],
        },
        {
          objectId: 'obj-line-detail-001',
          objectName: 'LineDetail__c',
          fields: [
            { fieldId: 'fld-detail-line-ref', fieldName: 'InvoiceLineRef__c', dataType: 'Lookup', referencedObject: 'obj-invoice-line-001', isRequired: true },
          ],
        },
      ],
      objectReferences: [
        {
          relationshipId: 'rel-001',
          sourceObjectId: 'obj-invoice-line-001',
          targetObjectId: 'obj-invoice-001',
          referenceFieldId: 'fld-line-invoice-ref',
          cardinality: 'Many-to-One',
          onDeleteBehavior: 'Cascade',
        },
        {
          relationshipId: 'rel-002',
          sourceObjectId: 'obj-line-detail-001',
          targetObjectId: 'obj-invoice-line-001',
          referenceFieldId: 'fld-detail-line-ref',
          cardinality: 'Many-to-One',
          onDeleteBehavior: 'Cascade',
        },
        {
          relationshipId: 'rel-003',
          sourceObjectId: 'obj-invoice-001',
          targetObjectId: 'obj-line-detail-001',
          referenceFieldId: 'fld-inv-detail-back-ref',
          cardinality: 'One-to-Many',
          onDeleteBehavior: 'Restrict',
        },
      ],
      calculationLogicDefinitions: [
        {
          logicId: 'logic-calc-001',
          objectId: 'obj-invoice-001',
          logicType: 'RollupAggregation',
          dependsOnFields: ['fld-line-amount'],
          dependsOnLogicIds: [],
          description: '合計金額を請求明細から集計',
        },
      ],
    });

    // Mock retrieveMappingDetailsByTargetSystem
    (mappingPersistence.retrieveMappingDetailsByTargetSystem as jest.Mock).mockResolvedValueOnce({
      targetSystemId: 'target-oracle-erp-01',
      standardFeatures: [
        {
          featureId: 'feat-invoice',
          featureName: '請求管理',
          supportedReferenceTypes: ['ForeignKey'],
          supportedCalculationTypes: ['SQLAggregate'],
        },
        {
          featureId: 'feat-invoice-line',
          featureName: '請求明細管理',
          supportedReferenceTypes: ['ForeignKey'],
          supportedCalculationTypes: ['SQLAggregate'],
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

    // Verify that CircularDependencyDetected error is thrown
    await expect(analyzeReferenceRelationships(input)).rejects.toThrow(CircularDependencyDetected);

    // Verify mapping persistence calls were made
    expect(mappingPersistence.retrieveMappingDetailsForProject).toHaveBeenCalledWith(projectId);
    expect(mappingPersistence.retrieveMappingDetailsByTargetSystem).toHaveBeenCalledWith(targetSystemId);
  });
});
