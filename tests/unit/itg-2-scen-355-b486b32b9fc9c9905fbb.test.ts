import { validateObjectReferenceRelationships } from '../../src/logic/data-validation-rules';
import type { ValidateObjectReferenceRelationshipsInput, ValidateObjectReferenceRelationshipsOutput } from '../../src/logic/data-validation-rules';
import type { ObjectReferenceRelationship, SalesforceObjectDefinition, ProjectContext } from '../../src/logic/data-validation-rules';

describe('SCEN-355: 有効な参照関係定義が複数件で全件成功', () => {
  it('すべての参照関係が有効で全件成功となる', async () => {
    // Preconditions
    const referenceRelationships: ObjectReferenceRelationship[] = [
      {
        referenceRelationshipId: 'ref-001',
        sourceObjectId: 'obj-invoice',
        targetObjectId: 'obj-account',
        referenceFieldName: 'accountRef',
        cardinality: '1:N',
        deleteAction: 'RESTRICT',
        required: false
      },
      {
        referenceRelationshipId: 'ref-002',
        sourceObjectId: 'obj-invoiceDetail',
        targetObjectId: 'obj-invoice',
        referenceFieldName: 'invoiceRef',
        cardinality: '1:N',
        deleteAction: 'CASCADE',
        required: false
      },
      {
        referenceRelationshipId: 'ref-003',
        sourceObjectId: 'obj-invoice',
        targetObjectId: 'obj-opportunity',
        referenceFieldName: 'opportunityRef',
        cardinality: '1:1',
        deleteAction: 'SET_NULL',
        required: false
      }
    ];

    const objectDefinitions: SalesforceObjectDefinition[] = [
      {
        objectName: 'Invoice',
        objectDescription: '',
        mappingTargetSalesforceObject: 'Invoice__c',
        fields: [
          { fieldName: 'accountRef', dataType: 'REFERENCE', required: false },
          { fieldName: 'opportunityRef', dataType: 'REFERENCE', required: false }
        ],
        recordCount: 0
      },
      {
        objectName: 'InvoiceDetail',
        objectDescription: '',
        mappingTargetSalesforceObject: 'InvoiceDetail__c',
        fields: [
          { fieldName: 'invoiceRef', dataType: 'REFERENCE', required: false }
        ],
        recordCount: 0
      },
      {
        objectName: 'Account',
        objectDescription: '',
        mappingTargetSalesforceObject: 'Account__c',
        fields: [
          { fieldName: 'id', dataType: 'TEXT', required: false }
        ],
        recordCount: 0
      },
      {
        objectName: 'Opportunity',
        objectDescription: '',
        mappingTargetSalesforceObject: 'Opportunity__c',
        fields: [
          { fieldName: 'id', dataType: 'TEXT', required: false }
        ],
        recordCount: 0
      }
    ];

    const projectContext: ProjectContext = {
      projectId: 'proj-salesforce-migration-001',
      targetSystemId: 'target-erp-system-001'
    };

    const input: ValidateObjectReferenceRelationshipsInput = {
      referenceRelationships,
      objectDefinitions,
      projectContext
    };

    // Execute
    const result: ValidateObjectReferenceRelationshipsOutput = await validateObjectReferenceRelationships(input);

    // Expected Result
    expect(result.isValid).toBe(true);
    expect(result.validationResults).toHaveLength(3);

    // All reference relationships should be valid
    for (let i = 0; i < 3; i++) {
      expect(result.validationResults[i].isValid).toBe(true);
      expect(result.validationResults[i].errors).toHaveLength(0);
    }

    // Summary
    expect(result.summary.totalObjectsValidated).toBe(3);
    expect(result.summary.successCount).toBe(3);
    expect(result.summary.errorCount).toBe(0);
    expect(result.summary.totalErrorsDetected).toBe(0);

    // Circular dependencies should be empty
    expect(result.circularDependencies).toBeDefined();
    if (result.circularDependencies) {
      expect(result.circularDependencies).toHaveLength(0);
    }
  });
});
