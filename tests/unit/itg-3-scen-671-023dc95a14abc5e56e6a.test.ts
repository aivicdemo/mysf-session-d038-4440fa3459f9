import { validateCSVExportInputs, SelectedDiscrepancyIdsEmpty } from '../../src/logic/authorization-validation';

describe('SCEN-671: validateCSVExportInputs with valid inputs', () => {
  it('should return isValid=true with validatedAt in ISO 8601 format when valid inputs are provided', async () => {
    const selectedDiscrepancyIds = [
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440001',
    ];
    const exportFormat = 'CSV';

    const result = await validateCSVExportInputs({
      selectedDiscrepancyIds,
      exportFormat,
    });

    expect(result.isValid).toBe(true);
    expect(result.validatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(new Date(result.validatedAt).getTime()).toBeGreaterThan(0);
  });
});
