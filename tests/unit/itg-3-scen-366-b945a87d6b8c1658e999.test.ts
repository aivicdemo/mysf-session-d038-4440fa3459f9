import { validateCSVExportInputs } from '../../src/logic/authorization-validation';

describe('SCEN-366: Boundary condition with exactly 10000 selectedDiscrepancyIds', () => {
  it('should return validation success when selectedDiscrepancyIds is exactly 10000 items', async () => {
    const selectedDiscrepancyIds = Array.from({ length: 10000 }, (_, i) => {
      const num = i.toString().padStart(2, '0');
      return `550e8400-e29b-41d4-a716-44665544${num}${num}`;
    });
    const exportFormat = 'CSV';

    const result = await validateCSVExportInputs({
      selectedDiscrepancyIds,
      exportFormat,
    });

    expect(result.isValid).toBe(true);
    expect(result.validatedAt).toBeDefined();
    expect(typeof result.validatedAt).toBe('string');

    const validatedAtDate = new Date(result.validatedAt);
    expect(validatedAtDate.getTime()).toBeGreaterThan(0);
    expect(result.validatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
