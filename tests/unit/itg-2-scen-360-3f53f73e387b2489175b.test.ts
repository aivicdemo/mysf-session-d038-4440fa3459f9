import { validateObjectReferenceRelationships } from '../../src/logic/data-validation-rules';
import type {
  ValidateObjectReferenceRelationshipsInput,
  ValidateObjectReferenceRelationshipsOutput,
} from '../../src/logic/data-validation-rules';

describe('SCEN-360: InvalidCardinality error when cardinality value is not 1:1, 1:N, or N:N', () => {
  it('should detect InvalidCardinality error when cardinality value is invalid', async () => {
    const input: ValidateObjectReferenceRelationshipsInput = {
      referenceRelationships: [
        {
          referenceRelationshipId: 'ref-004',
          sourceObjectId: 'Account',
          targetObjectId: 'Contact',
          referenceFieldName: 'AccountId',
          cardinality: '2:3',
          deleteAction: 'CASCADE',
          required: false,
        },
      ],
      objectDefinitions: [
        {
          objectId: 'Account',
          objectName: 'Account',
          fields: [
            {
              fieldId: 'Id',
              fieldName: 'Id',
              dataType: 'Id',
              required: true,
            },
          ],
        },
        {
          objectId: 'Contact',
          objectName: 'Contact',
          fields: [
            {
              fieldId: 'AccountId',
              fieldName: 'AccountId',
              dataType: 'Reference',
              required: false,
            },
          ],
        },
      ],
      projectContext: {
        projectId: 'proj-001',
        targetSystemId: 'target-sys-001',
      },
    };

    const result: ValidateObjectReferenceRelationshipsOutput = await validateObjectReferenceRelationships(input);

    expect(result.isValid).toBe(false);
    expect(result.validationResults).toHaveLength(1);
    expect(result.validationResults[0].isValid).toBe(false);
    const cardinalityError = result.validationResults[0].errors.find(e => e.errorCode === 'InvalidCardinality');
    expect(cardinalityError).toBeDefined();
    expect(cardinalityError?.errorMessage).toContain(
      'カーディナリティが無効です。1:1、1:N、N:N のいずれかを指定してください。'
    );
    expect(result.summary.errorCount).toBeGreaterThanOrEqual(1);
  });
});
