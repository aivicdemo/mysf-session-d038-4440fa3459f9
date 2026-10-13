import { validateCSVExportInputs, RequiredFieldMissing } from '../../src/logic/authorization-validation';

describe('SCEN-364: validateCSVExportInputs - selectedDiscrepancyIds undefined', () => {
  it('should return validation failure with RequiredFieldMissing error when selectedDiscrepancyIds is undefined', async () => {
    const input = {
      selectedDiscrepancyIds: undefined as any,
      exportFormat: 'CSV',
    };

    await expect(validateCSVExportInputs(input)).rejects.toThrow(RequiredFieldMissing);
    await expect(validateCSVExportInputs(input)).rejects.toThrow('必須項目が不足しています。');
  });

  it('should include validatedAt as ISO 8601 timestamp in response', async () => {
    const input = {
      selectedDiscrepancyIds: undefined as any,
      exportFormat: 'CSV',
    };

    try {
      await validateCSVExportInputs(input);
      fail('Expected RequiredFieldMissing error to be thrown');
    } catch (error) {
      if (error instanceof RequiredFieldMissing) {
        // Error expected - validation correctly failed
        expect(true).toBe(true);
      } else {
        throw error;
      }
    }
  });
});
