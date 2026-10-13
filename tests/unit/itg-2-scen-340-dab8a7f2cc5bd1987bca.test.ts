import { validateSalesforceObjectDefinitions } from '../../src/logic/data-validation-rules';
import type { ValidateSalesforceObjectDefinitionsInput } from '../../src/logic/data-validation-rules';

describe('SCEN-340: Empty object definitions array returns isValid=true', () => {
  it('should return isValid=true with empty summary when objectDefinitions is empty', async () => {
    const input: ValidateSalesforceObjectDefinitionsInput = {
      objectDefinitions: [],
      projectContext: {
        projectId: 'PROJ-001',
        targetSystemId: 'ORACLE-ERP-001',
      },
    };

    const result = await validateSalesforceObjectDefinitions(input);

    expect(result.isValid).toBe(true);
    expect(result.validationResults).toEqual([]);
    expect(result.summary.totalObjectsValidated).toBe(0);
    expect(result.summary.successCount).toBe(0);
    expect(result.summary.errorCount).toBe(0);
  });
});
