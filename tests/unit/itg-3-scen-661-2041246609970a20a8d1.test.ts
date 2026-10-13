import { validateCSVExportInputs } from '../../src/logic/authorization-validation';

describe('SCEN-661: 差異の種類と金額規模から自動同期が最適な是正方法と判定され、修正方法判定工程へ進む', () => {
  it('should validate all rules and return isValid=true with ISO 8601 validatedAt', async () => {
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
