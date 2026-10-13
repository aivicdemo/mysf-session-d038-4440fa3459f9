import { validateCSVExportInputs } from '../../src/logic/authorization-validation';

describe('SCEN-674: 金額ズレが手動修正の閾値を超えるか件数が多い場合、自動同期またはロールバックの検討へ進む', () => {
  it('should validate CSV export inputs with valid UUID format discrepancy IDs and return isValid true with ISO 8601 timestamp', async () => {
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
