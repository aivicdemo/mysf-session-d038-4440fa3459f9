import { validateObjectReferenceRelationships } from '../../src/logic/data-validation-rules';
import type { ValidateObjectReferenceRelationshipsInput, ValidateObjectReferenceRelationshipsOutput } from '../../src/logic/data-validation-rules';
import type { ObjectReferenceRelationship, SalesforceObjectDefinition, ProjectContext } from '../../src/logic/data-validation-rules';

describe('SCEN-356: 参照関係定義に必須項目が不足している場合のエラー', () => {
  it('カーディナリティが null の場合にエラーが検出される', async () => {
    // Preconditions
    const referenceRelationships: ObjectReferenceRelationship[] = [
      {
        referenceRelationshipId: 'ref-001',
        sourceObjectId: 'Invoice__c',
        targetObjectId: 'InvoiceLineItem__c',
        referenceFieldName: 'InvoiceRef__c',
        cardinality: null as any,
        deleteAction: 'CASCADE',
        required: false
      }
    ];

    const objectDefinitions: SalesforceObjectDefinition[] = [
      {
        objectName: 'Invoice__c',
        objectDescription: '',
        mappingTargetSalesforceObject: 'Invoice__c',
        fields: [
          { fieldName: 'Id', dataType: 'Id', required: false }
        ],
        recordCount: 0
      },
      {
        objectName: 'InvoiceLineItem__c',
        objectDescription: '',
        mappingTargetSalesforceObject: 'InvoiceLineItem__c',
        fields: [
          { fieldName: 'InvoiceRef__c', dataType: 'Lookup', required: false }
        ],
        recordCount: 0
      }
    ];

    const projectContext: ProjectContext = {
      projectId: 'PROJ-001',
      targetSystemId: 'TGTSYS-001'
    };

    const input: ValidateObjectReferenceRelationshipsInput = {
      referenceRelationships,
      objectDefinitions,
      projectContext
    };

    // Execute
    const result: ValidateObjectReferenceRelationshipsOutput = await validateObjectReferenceRelationships(input);

    // Expected Result
    expect(result.isValid).toBe(false);
    expect(result.validationResults).toHaveLength(1);

    // First validation result should have error
    const validationResult = result.validationResults[0];
    expect(validationResult.isValid).toBe(false);
    expect(validationResult.errors.length).toBeGreaterThan(0);

    // Check for InvalidReferenceRelationshipStructure error
    const hasInvalidStructureError = validationResult.errors.some(
      error => error.errorCode === 'InvalidReferenceRelationshipStructure'
    );
    expect(hasInvalidStructureError).toBe(true);

    // Verify error message contains the expected text
    const invalidStructureError = validationResult.errors.find(
      error => error.errorCode === 'InvalidReferenceRelationshipStructure'
    );
    expect(invalidStructureError).toBeDefined();
    if (invalidStructureError) {
      expect(invalidStructureError.errorMessage).toContain('必須');
    }

    // Summary
    expect(result.summary.totalObjectsValidated).toBeGreaterThanOrEqual(1);
    expect(result.summary.errorCount).toBeGreaterThanOrEqual(1);
  });
});
