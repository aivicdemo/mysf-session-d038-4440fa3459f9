import { analyzeReferenceRelationships, TargetSystemNotFound } from '../../src/logic/reference-relationship-analyzer';
import type { AnalyzeReferenceRelationshipsInput } from '../../src/logic/reference-relationship-analyzer';
import * as mappingPersistence from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/mapping-persistence');

describe('SCEN-118: analyzeReferenceRelationships - TargetSystemNotFoundエラー', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定された移行対象システムIDが存在しないまたはプロジェクトに属していない場合、TargetSystemNotFoundエラーを返す', async () => {
    const projectId = 'proj_20250107_001';
    const targetSystemId = 'tgt_sys_99999';
    const executedAt = new Date('2025-01-07T10:30:00.000Z');
    const executedByUserId = 'user_admin_001';

    // Mock retrieveMappingDetailsForProject to return project data
    (mappingPersistence.retrieveMappingDetailsForProject as jest.Mock).mockResolvedValueOnce({
      customObjectDefinitions: [
        {
          objectId: 'obj_invoice_001',
          objectName: 'Invoice__c',
          fields: [
            { fieldId: 'fld_inv_001', fieldName: 'InvoiceNumber__c', dataType: 'Text' },
            { fieldId: 'fld_inv_002', fieldName: 'InvoiceDate__c', dataType: 'Date' },
          ],
        },
        {
          objectId: 'obj_invoice_line_001',
          objectName: 'InvoiceLine__c',
          fields: [
            { fieldId: 'fld_line_001', fieldName: 'LineAmount__c', dataType: 'Currency' },
          ],
        },
      ],
      objectReferences: [
        {
          relationshipId: 'rel_001',
          sourceObject: 'obj_invoice_line_001',
          targetObject: 'obj_invoice_001',
          referenceField: 'Invoice__c',
          cardinality: 'ManyToOne',
          deleteAction: 'Cascade',
        },
      ],
      calculationLogicDefinitions: [
        {
          logicId: 'logic_001',
          targetObject: 'obj_invoice_001',
          logicType: 'RollupSummary',
          dependentFields: ['fld_line_001'],
        },
      ],
    });

    // Mock retrieveMappingDetailsByTargetSystem to return empty (target system not found)
    (mappingPersistence.retrieveMappingDetailsByTargetSystem as jest.Mock).mockResolvedValueOnce({
      standardFeatures: [],
    });

    const input: AnalyzeReferenceRelationshipsInput = {
      projectId,
      targetSystemId,
      includeCalculationLogicDependencies: true,
      executedAt,
      executedByUserId,
    };

    // Verify that TargetSystemNotFound error is thrown
    await expect(analyzeReferenceRelationships(input)).rejects.toThrow(TargetSystemNotFound);

    // Verify both mapping persistence calls were made
    expect(mappingPersistence.retrieveMappingDetailsForProject).toHaveBeenCalledWith(projectId);
    expect(mappingPersistence.retrieveMappingDetailsByTargetSystem).toHaveBeenCalledWith(targetSystemId);
  });
});
