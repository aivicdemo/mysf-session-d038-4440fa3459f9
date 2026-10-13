import { validateObjectReferenceRelationships } from '../../src/logic/data-validation-rules';
import type {
  ValidateObjectReferenceRelationshipsInput,
  ValidateObjectReferenceRelationshipsOutput,
} from '../../src/logic/data-validation-rules';

describe('SCEN-363: InvalidRequiredFlagWithDeleteBehavior error when required field has SET_NULL delete behavior', () => {
  it('should detect InvalidRequiredFlagWithDeleteBehavior error when required reference field has SET_NULL delete behavior', async () => {
    const input: ValidateObjectReferenceRelationshipsInput = {
      referenceRelationships: [
        {
          referenceRelationshipId: 'ref-009',
          sourceObjectId: 'Invoice',
          targetObjectId: 'Account',
          referenceFieldName: 'Account_Ref',
          cardinality: 'N:1',
          deleteAction: 'SET_NULL',
          required: true,
        },
      ],
      objectDefinitions: [
        {
          objectId: 'Invoice',
          objectName: '請求書',
          fields: [
            {
              fieldId: 'Account_Ref',
              fieldName: '取引先参照',
              dataType: 'Lookup',
              required: true,
            },
          ],
        },
        {
          objectId: 'Account',
          objectName: '取引先',
          fields: [
            {
              fieldId: 'AccountId',
              fieldName: '取引先ID',
              dataType: 'Text',
              required: false,
            },
          ],
        },
      ],
      projectContext: {
        projectId: 'proj-001',
        targetSystemId: 'target-001',
      },
    };

    const result: ValidateObjectReferenceRelationshipsOutput = await validateObjectReferenceRelationships(input);

    expect(result.isValid).toBe(false);
    expect(result.validationResults).toHaveLength(1);
    expect(result.validationResults[0].isValid).toBe(false);
    const requiredFlagError = result.validationResults[0].errors.find(
      e => e.errorCode === 'InvalidRequiredFlagWithDeleteBehavior'
    );
    expect(requiredFlagError).toBeDefined();
    expect(requiredFlagError?.errorMessage).toContain(
      '必須参照フィールドの削除時動作を SET_NULL に設定することはできません。RESTRICT または CASCADE を指定してください。'
    );
    expect(result.summary.errorCount).toBeGreaterThanOrEqual(1);
  });
});
