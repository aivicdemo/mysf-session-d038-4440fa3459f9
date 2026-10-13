import { validateCSVExportInputs } from '../../src/logic/authorization-validation';

describe('SCEN-675: 自動同期検討時にデータ整合性スコアが70以上の場合、自動同期が選択される', () => {
  it('should validate CSV export inputs with 3 valid UUID discrepancy IDs and CSV format, returning isValid true with ISO 8601 timestamp', async () => {
    const selectedDiscrepancyIds = [
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002',
      '550e8400-e29b-41d4-a716-446655440003'
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
