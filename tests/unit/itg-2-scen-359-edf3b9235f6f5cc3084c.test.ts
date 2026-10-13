import { validateObjectReferenceRelationships } from '../../src/logic/data-validation-rules';
import type {
  ValidateObjectReferenceRelationshipsInput,
  ValidateObjectReferenceRelationshipsOutput,
} from '../../src/logic/data-validation-rules';

describe('SCEN-359: ReferenceFieldNotFoundInSourceObject error when reference field does not exist in source object', () => {
  it('should detect ReferenceFieldNotFoundInSourceObject error when reference field does not exist in source object', async () => {
    const input: ValidateObjectReferenceRelationshipsInput = {
      referenceRelationships: [
        {
          referenceRelationshipId: 'ref-003',
          sourceObjectId: 'Invoice',
          targetObjectId: 'Account',
          referenceFieldName: 'nonexistent_field',
          cardinality: '1:N',
          deleteAction: 'RESTRICT',
          required: false,
        },
      ],
      objectDefinitions: [
        {
          objectId: 'Invoice',
          objectName: 'Invoice',
          fields: [
            {
              fieldId: 'invoice_number',
              fieldName: 'invoice_number',
              dataType: 'Text',
              required: false,
            },
            {
              fieldId: 'amount',
              fieldName: 'amount',
              dataType: 'Currency',
              required: false,
            },
          ],
        },
        {
          objectId: 'Account',
          objectName: 'Account',
          fields: [
            {
              fieldId: 'account_name',
              fieldName: 'account_name',
              dataType: 'Text',
              required: false,
            },
          ],
        },
      ],
      projectContext: {
        projectId: 'proj-20250107-001',
        targetSystemId: 'salesforce-migration-001',
      },
    };

    const result: ValidateObjectReferenceRelationshipsOutput = await validateObjectReferenceRelationships(input);

    expect(result.isValid).toBe(false);
    expect(result.validationResults).toHaveLength(1);
    expect(result.validationResults[0].isValid).toBe(false);
    expect(result.validationResults[0].errors.length).toBeGreaterThanOrEqual(1);
    const fieldNotFoundError = result.validationResults[0].errors.find(
      e => e.errorCode === 'ReferenceFieldNotFoundInSourceObject'
    );
    expect(fieldNotFoundError).toBeDefined();
    expect(fieldNotFoundError?.errorMessage).toContain(
      '参照フィールドがソースオブジェクトに見つかりません。ソースオブジェクトのフィールド定義を確認してください。'
    );
    expect(result.summary.errorCount).toBeGreaterThanOrEqual(1);
    expect(result.summary.successCount).toEqual(0);
    expect(result.circularDependencies).toEqual([]);
  });
});
