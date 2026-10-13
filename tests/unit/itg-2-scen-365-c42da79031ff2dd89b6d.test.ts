import { validateObjectReferenceRelationships } from '../../src/logic/data-validation-rules';

describe('SCEN-365: projectContext の projectId が null の場合、InvalidProjectContext エラー', () => {
  it('projectId が null のとき、InvalidProjectContext エラーが発生する', async () => {
    const projectContext: any = {
      projectId: null,
      targetSystemId: 'ORACLE_ERP_001',
    };

    const referenceRelationships: any[] = [
      {
        referenceRelationshipId: 'ref-001',
        sourceObjectId: 'Invoice__c',
        targetObjectId: 'InvoiceLineItem__c',
        referenceFieldName: 'InvoiceId__c',
        cardinality: '1:N',
        deleteAction: 'CASCADE',
        required: false,
      },
    ];

    const objectDefinitions: any[] = [
      {
        objectName: 'Invoice',
        objectDescription: 'Invoice Object',
        mappingTargetSalesforceObject: 'Invoice__c',
        fields: [
          { fieldName: 'InvoiceId__c', dataType: 'Text', required: false },
        ],
        recordCount: 0,
      },
      {
        objectName: 'InvoiceLineItem',
        objectDescription: 'Invoice Line Item Object',
        mappingTargetSalesforceObject: 'InvoiceLineItem__c',
        fields: [
          { fieldName: 'InvoiceId__c', dataType: 'Lookup', required: false },
        ],
        recordCount: 0,
      },
    ];

    const input: any = {
      projectContext,
      referenceRelationships,
      objectDefinitions,
    };

    const result = await validateObjectReferenceRelationships(input);

    expect(result.isValid).toBe(false);
    expect(result.validationResults.length).toBeGreaterThanOrEqual(1);

    const hasInvalidProjectContextError = result.validationResults.some(vr =>
      vr.errors.some(
        e =>
          e.errorCode === 'InvalidProjectContext' &&
          e.errorMessage === 'プロジェクトコンテキストが無効です。projectId と targetSystemId を指定してください。'
      )
    );

    expect(hasInvalidProjectContextError).toBe(true);
    expect(result.summary.errorCount).toBeGreaterThanOrEqual(1);
  });
});
