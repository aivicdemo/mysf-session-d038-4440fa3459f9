import { validateCSVExportInputs, ValidateCSVExportInputsInput, ValidateCSVExportInputsOutput } from '../../src/logic/authorization-validation';

describe('SCEN-685: CSV出力入力値検証 - 3件のUUIDで全検証ルール成功', () => {
  it('should pass all validation rules with 3 valid UUID format IDs and CSV format', async () => {
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
