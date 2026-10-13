import { validateCSVExportInputs } from '../../src/logic/authorization-validation';

describe('SCEN-669: マッチングできない請求書がある場合、警告を記録し処理を続行する', () => {
  it('should validate CSV export inputs with 3 valid UUIDs and return isValid=true with ISO 8601 validatedAt', async () => {
    const selectedDiscrepancyIds = [
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002'
    ];
    const exportFormat = 'CSV';

    const result = await validateCSVExportInputs({
      selectedDiscrepancyIds,
      exportFormat
    });

    expect(result.isValid).toBe(true);
    expect(result.validatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(new Date(result.validatedAt)).not.toBeNaN();
  });
});
