import { validateCSVExportInputs, ValidateCSVExportInputsInput, ValidateCSVExportInputsOutput } from '../../src/logic/authorization-validation';

describe('SCEN-676: CSV出力入力値検証 - 内部検証ルール確認で3件のUUID形式で成功', () => {
  it('should validate all required fields and type and range for CSV export with 3 valid UUIDs', async () => {
    const input: ValidateCSVExportInputsInput = {
      selectedDiscrepancyIds: [
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440002',
        '550e8400-e29b-41d4-a716-446655440003'
      ],
      exportFormat: 'CSV'
    };

    const result: ValidateCSVExportInputsOutput = await validateCSVExportInputs(input);

    expect(result.isValid).toBe(true);
    expect(result.validatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
