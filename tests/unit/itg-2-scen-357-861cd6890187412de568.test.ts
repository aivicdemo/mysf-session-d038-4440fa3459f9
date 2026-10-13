import { validateObjectReferenceRelationships } from '../../src/logic/data-validation-rules';
import type {
  ValidateObjectReferenceRelationshipsInput,
  ValidateObjectReferenceRelationshipsOutput,
} from '../../src/logic/data-validation-rules';

describe('SCEN-357: SourceObjectNotFound error when reference relationship source object does not exist', () => {
  it('should detect SourceObjectNotFound error when source object ID does not exist in object definitions', async () => {
    const input: ValidateObjectReferenceRelationshipsInput = {
      referenceRelationships: [
        {
          referenceRelationshipId: 'ref-001',
          sourceObjectId: 'NonExistentSourceObject',
          targetObjectId: 'Invoice',
          referenceFieldName: 'invoiceRef',
          cardinality: '1:N',
          deleteAction: 'RESTRICT',
          required: false,
        },
      ],
      objectDefinitions: [
        {
          objectId: 'Account',
          objectName: '取引先',
          fields: [
            {
              fieldId: 'Name',
              fieldName: 'Name',
              dataType: 'Text',
              required: true,
            },
          ],
        },
        {
          objectId: 'Invoice',
          objectName: '請求書',
          fields: [
            {
              fieldId: 'invoiceRef',
              fieldName: 'invoiceRef',
              dataType: 'Lookup',
              required: false,
            },
          ],
        },
      ],
      projectContext: {
        projectId: 'PROJ-2025-001',
        targetSystemId: 'SYS-ORACLE-001',
      },
    };

    const result: ValidateObjectReferenceRelationshipsOutput = await validateObjectReferenceRelationships(input);

    expect(result.isValid).toBe(false);
    expect(result.validationResults).toHaveLength(1);
    expect(result.validationResults[0].isValid).toBe(false);
    expect(result.validationResults[0].errors).toHaveLength(1);
    expect(result.validationResults[0].errors[0].errorCode).toBe('SourceObjectNotFound');
    expect(result.validationResults[0].errors[0].errorMessage).toContain(
      '参照関係のソースオブジェクトが見つかりません。オブジェクト定義に存在するオブジェクトを指定してください。'
    );
    expect(result.summary.totalObjectsValidated).toBe(1);
    expect(result.summary.errorCount).toBeGreaterThanOrEqual(1);
    expect(result.circularDependencies).toEqual([]);
  });
});
