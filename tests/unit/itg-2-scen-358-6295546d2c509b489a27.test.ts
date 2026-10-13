import { validateObjectReferenceRelationships } from '../../src/logic/data-validation-rules';
import type {
  ValidateObjectReferenceRelationshipsInput,
  ValidateObjectReferenceRelationshipsOutput,
} from '../../src/logic/data-validation-rules';

describe('SCEN-358: TargetObjectNotFound error when reference relationship target object does not exist', () => {
  it('should detect TargetObjectNotFound error when target object ID does not exist in object definitions', async () => {
    const input: ValidateObjectReferenceRelationshipsInput = {
      referenceRelationships: [
        {
          referenceRelationshipId: 'ref-002',
          sourceObjectId: 'Invoice',
          targetObjectId: 'NonExistentObject',
          referenceFieldName: 'relatedObject',
          cardinality: '1:N',
          deleteAction: 'CASCADE',
          required: false,
        },
      ],
      objectDefinitions: [
        {
          objectId: 'Invoice',
          objectName: '請求書',
          fields: [
            {
              fieldId: 'relatedObject',
              fieldName: 'relatedObject',
              dataType: 'LOOKUP',
              required: false,
            },
          ],
        },
        {
          objectId: 'InvoiceDetail',
          objectName: '請求明細',
          fields: [
            {
              fieldId: 'invoiceId',
              fieldName: 'invoiceId',
              dataType: 'LOOKUP',
              required: true,
            },
          ],
        },
      ],
      projectContext: {
        projectId: 'proj-12345',
        targetSystemId: 'salesforce-org-001',
      },
    };

    const result: ValidateObjectReferenceRelationshipsOutput = await validateObjectReferenceRelationships(input);

    expect(result.isValid).toBe(false);
    expect(result.validationResults).toHaveLength(1);
    expect(result.validationResults[0].isValid).toBe(false);
    expect(result.validationResults[0].errors.length).toBeGreaterThanOrEqual(1);
    const targetNotFoundError = result.validationResults[0].errors.find(e => e.errorCode === 'TargetObjectNotFound');
    expect(targetNotFoundError).toBeDefined();
    expect(targetNotFoundError?.errorMessage).toContain(
      '参照関係のターゲットオブジェクトが見つかりません。オブジェクト定義に存在するオブジェクトを指定してください。'
    );
    expect(result.summary.errorCount).toBeGreaterThanOrEqual(1);
  });
});
