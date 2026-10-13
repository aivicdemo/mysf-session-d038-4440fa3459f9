import { validateObjectReferenceRelationships } from '../../src/logic/data-validation-rules';

describe('SCEN-366: 参照関係定義が空配列のとき、isValid が true で validationResults が空配列', () => {
  it('参照関係が空のとき、isValid は true で validationResults は空配列になる', async () => {
    const projectContext: any = {
      projectId: 'proj_123',
      targetSystemId: 'target_oracle_001',
    };

    const referenceRelationships: any[] = [];

    const objectDefinitions: any[] = [
      {
        objectName: 'Invoice',
        objectDescription: 'Invoice',
        mappingTargetSalesforceObject: 'obj_invoice',
        fields: [
          { fieldName: 'invoiceNumber', dataType: 'Text', required: false },
        ],
        recordCount: 0,
      },
      {
        objectName: 'Account',
        objectDescription: 'Account',
        mappingTargetSalesforceObject: 'obj_account',
        fields: [
          { fieldName: 'accountName', dataType: 'Text', required: true },
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

    expect(result.isValid).toBe(true);
    expect(result.validationResults).toEqual([]);
    expect(result.summary.totalObjectsValidated).toBe(0);
    expect(result.summary.successCount).toBe(0);
    expect(result.circularDependencies).toEqual([]);
  });
});
