import { validateObjectReferenceRelationships } from '../../src/logic/data-validation-rules';
import type {
  ValidateObjectReferenceRelationshipsInput,
  ValidateObjectReferenceRelationshipsOutput,
} from '../../src/logic/data-validation-rules';

describe('SCEN-362: CircularDependencyDetected error when circular dependency is found', () => {
  it('should detect CircularDependencyDetected error when circular reference chain exists', async () => {
    const input: ValidateObjectReferenceRelationshipsInput = {
      referenceRelationships: [
        {
          referenceRelationshipId: 'ref-006',
          sourceObjectId: 'obj-A',
          targetObjectId: 'obj-B',
          referenceFieldName: 'refToB',
          cardinality: '1:N',
          deleteAction: 'RESTRICT',
          required: false,
        },
        {
          referenceRelationshipId: 'ref-007',
          sourceObjectId: 'obj-B',
          targetObjectId: 'obj-C',
          referenceFieldName: 'refToC',
          cardinality: '1:N',
          deleteAction: 'RESTRICT',
          required: false,
        },
        {
          referenceRelationshipId: 'ref-008',
          sourceObjectId: 'obj-C',
          targetObjectId: 'obj-A',
          referenceFieldName: 'refToA',
          cardinality: '1:N',
          deleteAction: 'RESTRICT',
          required: false,
        },
      ],
      objectDefinitions: [
        {
          objectId: 'obj-A',
          objectName: 'ObjectA',
          fields: [
            {
              fieldId: 'field-A1',
              fieldName: 'refToB',
              dataType: 'REFERENCE',
              required: false,
            },
          ],
        },
        {
          objectId: 'obj-B',
          objectName: 'ObjectB',
          fields: [
            {
              fieldId: 'field-B1',
              fieldName: 'refToC',
              dataType: 'REFERENCE',
              required: false,
            },
          ],
        },
        {
          objectId: 'obj-C',
          objectName: 'ObjectC',
          fields: [
            {
              fieldId: 'field-C1',
              fieldName: 'refToA',
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
    expect(result.summary.errorCount).toBeGreaterThanOrEqual(1);
    expect(result.circularDependencies.length).toBeGreaterThan(0);
    const circularError = result.validationResults.find(r =>
      r.errors.some(e => e.errorCode === 'CircularDependencyDetected')
    );
    expect(circularError).toBeDefined();
    const circularErrorDetail = circularError?.errors.find(e => e.errorCode === 'CircularDependencyDetected');
    expect(circularErrorDetail?.errorMessage).toContain(
      '循環依存が検出されました。参照関係の定義を見直してください。'
    );
  });
});
