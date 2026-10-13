import { validateCSVExportInputs } from '../../src/logic/authorization-validation';

describe('SCEN-677: ロールバック選択時、営業データ損失リスクと業務継続性への影響評価が出力される', () => {
  it('should validate CSV export inputs with 3 valid UUID discrepancy IDs and return isValid true with ISO 8601 timestamp, without errors', async () => {
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
    expect(result.validatedAt).toBeDefined();
    expect(typeof result.validatedAt).toBe('string');
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d{3})?Z?$/;
    expect(result.validatedAt).toMatch(isoDateRegex);
  });
});
