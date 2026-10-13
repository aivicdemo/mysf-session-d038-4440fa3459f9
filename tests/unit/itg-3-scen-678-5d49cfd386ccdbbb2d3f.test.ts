import { validateCSVExportInputs } from '../../src/logic/authorization-validation';

describe('SCEN-678: 手動修正または自動同期が選択された場合、優先度は高として出力される', () => {
  it('should validate CSV export inputs with 2 valid UUID discrepancy IDs and CSV format, returning isValid true with ISO 8601 timestamp', async () => {
    const selectedDiscrepancyIds = [
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440001'
    ];
    const exportFormat = 'CSV';

    const result = await validateCSVExportInputs({
      selectedDiscrepancyIds,
      exportFormat
    });

    expect(result.isValid).toBe(true);
    expect(result.validatedAt).toBeDefined();
    expect(typeof result.validatedAt).toBe('string');
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d{3})?Z?$/;
    expect(result.validatedAt).toMatch(isoDateRegex);
  });
});
