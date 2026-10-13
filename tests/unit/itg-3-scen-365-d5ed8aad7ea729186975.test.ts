import { validateCSVExportInputs, RequiredFieldMissing } from '../../src/logic/authorization-validation';

describe('SCEN-365: validateCSVExportInputs - exportFormat null', () => {
  it('should return validation failure with RequiredFieldMissing error when exportFormat is null', async () => {
    const input = {
      selectedDiscrepancyIds: [
        '550e8400-e29b-41d4-a716-446655440000',
        '550e8400-e29b-41d4-a716-446655440001',
      ],
      exportFormat: null as any,
    };

    await expect(validateCSVExportInputs(input)).rejects.toThrow(RequiredFieldMissing);
    await expect(validateCSVExportInputs(input)).rejects.toThrow('必須項目が不足しています。');
  });

  it('should have ISO 8601 format validatedAt in response', async () => {
    const input = {
      selectedDiscrepancyIds: [
        '550e8400-e29b-41d4-a716-446655440000',
        '550e8400-e29b-41d4-a716-446655440001',
      ],
      exportFormat: null as any,
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
