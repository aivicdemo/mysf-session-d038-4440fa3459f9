import { validateCSVExportInputs } from '../../src/logic/authorization-validation';

describe('SCEN-659: 差異レコードの差異種類ごとに許容基準が取得でき、各差異が許容範囲内か超過かの判定基準が確定する', () => {
  it('should pass all validation rules and return isValid=true with ISO 8601 validatedAt', async () => {
    const selectedDiscrepancyIds = ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003'];
    const exportFormat = 'CSV';

    const result = await validateCSVExportInputs({
      selectedDiscrepancyIds,
      exportFormat,
    });

    expect(result.isValid).toBe(true);
    expect(result.validatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
