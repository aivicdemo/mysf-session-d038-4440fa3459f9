import { validateCSVExportInputs } from '../../src/logic/authorization-validation';

describe('SCEN-367: validateCSVExportInputs - boundary case with 1 discrepancy ID', () => {
  it('should return validation success when selectedDiscrepancyIds has exactly 1 UUID and exportFormat is CSV', async () => {
    const input = {
      selectedDiscrepancyIds: ['550e8400-e29b-41d4-a716-446655440000'],
      exportFormat: 'CSV',
    };

    const result = await validateCSVExportInputs(input);

    expect(result.isValid).toBe(true);
    expect(result.validatedAt).toBeDefined();
  });

  it('should return ISO 8601 formatted validatedAt containing current date-time', async () => {
    const input = {
      selectedDiscrepancyIds: ['550e8400-e29b-41d4-a716-446655440000'],
      exportFormat: 'CSV',
    };

    const beforeCall = new Date();
    const result = await validateCSVExportInputs(input);
    const afterCall = new Date();

    expect(result.isValid).toBe(true);
    expect(result.validatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);

    const validatedTime = new Date(result.validatedAt);
    expect(validatedTime.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
    expect(validatedTime.getTime()).toBeLessThanOrEqual(afterCall.getTime());
  });
});
