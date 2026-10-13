import { validateObjectReferenceRelationships } from '../../src/logic/data-validation-rules';
import type {
  ValidateObjectReferenceRelationshipsInput,
  ValidateObjectReferenceRelationshipsOutput,
} from '../../src/logic/data-validation-rules';

describe('SCEN-361: InvalidDeleteBehavior error when delete behavior is not CASCADE, RESTRICT, or SET_NULL', () => {
  it('should detect InvalidDeleteBehavior error when delete behavior is invalid', async () => {
    const input: ValidateObjectReferenceRelationshipsInput = {
      referenceRelationships: [
        {
          referenceRelationshipId: 'ref-005',
          sourceObjectId: 'Invoice',
          targetObjectId: 'Account',
          referenceFieldName: 'AccountRef',
          cardinality: '1:N',
          deleteAction: 'INVALID_BEHAVIOR',
          required: false,
        },
      ],
      objectDefinitions: [
        {
          objectId: 'Invoice',
          objectName: 'Invoice',
          fields: [
            {
              fieldId: 'AccountRef',
              fieldName: 'AccountRef',
              dataType: 'Lookup',
              required: false,
            },
          ],
        },
        {
          objectId: 'Account',
          objectName: 'Account',
          fields: [
            {
              fieldId: 'Name',
              fieldName: 'Name',
              dataType: 'Text',
              required: true,
            },
          ],
        },
      ],
      projectContext: {
        projectId: 'proj-12345',
        targetSystemId: 'target-sys-001',
      },
    };

    const result: ValidateObjectReferenceRelationshipsOutput = await validateObjectReferenceRelationships(input);

    expect(result.isValid).toBe(false);
    expect(result.validationResults).toHaveLength(1);
    expect(result.validationResults[0].isValid).toBe(false);
    const deleteBehaviorError = result.validationResults[0].errors.find(
      e => e.errorCode === 'InvalidDeleteBehavior'
    );
    expect(deleteBehaviorError).toBeDefined();
    expect(deleteBehaviorError?.errorMessage).toContain(
      '削除時の動作が無効です。CASCADE、RESTRICT、SET_NULL のいずれかを指定してください。'
    );
    expect(result.summary.errorCount).toBeGreaterThanOrEqual(1);
  });
});
