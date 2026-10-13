import { validateObjectReferenceRelationships } from '../../src/logic/data-validation-rules';
import type {
  ValidateObjectReferenceRelationshipsInput,
  ValidateObjectReferenceRelationshipsOutput,
} from '../../src/logic/data-validation-rules';

describe('SCEN-364: DuplicateReferenceRelationship error when duplicate reference relationships are found', () => {
  it('should detect DuplicateReferenceRelationship error when same source, target, and reference field combination exists multiple times', async () => {
    const input: ValidateObjectReferenceRelationshipsInput = {
      referenceRelationships: [
        {
          referenceRelationshipId: 'ref-010',
          sourceObjectId: 'Account',
          targetObjectId: 'Invoice',
          referenceFieldName: 'AccountReference',
          cardinality: '1:N',
          deleteAction: 'CASCADE',
          required: false,
        },
        {
          referenceRelationshipId: 'ref-011',
          sourceObjectId: 'Account',
          targetObjectId: 'Invoice',
          referenceFieldName: 'AccountReference',
          cardinality: '1:N',
          deleteAction: 'RESTRICT',
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
              dataType: 'TEXT',
              required: false,
            },
          ],
        },
        {
          objectId: 'Invoice',
          objectName: 'Invoice',
          fields: [
            {
              fieldId: 'AccountReference',
              fieldName: 'AccountReference',
              dataType: 'REFERENCE',
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
    expect(result.validationResults.length).toBeGreaterThanOrEqual(1);
    const duplicateError = result.validationResults.find(r =>
      r.errors.some(e => e.errorCode === 'DuplicateReferenceRelationship')
    );
    expect(duplicateError).toBeDefined();
    expect(duplicateError?.errors.find(e => e.errorCode === 'DuplicateReferenceRelationship')?.errorMessage).toContain(
      '重複する参照関係定義が見つかりました。同一の参照関係は1つだけ定義してください。'
    );
    expect(result.summary.errorCount).toBeGreaterThanOrEqual(1);
    expect(result.summary.successCount).toBe(0);
  });
});
