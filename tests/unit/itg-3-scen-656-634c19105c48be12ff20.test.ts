import { validateCSVExportInputs } from '../../src/logic/authorization-validation';

describe('SCEN-656: CSV出力対象として選択された差異レコードの入力値が妥当な場合、詳細情報の一括取得へ進む', () => {
  it('should return isValid=true and validatedAt in ISO 8601 format when inputs are valid', async () => {
    const selectedDiscrepancyIds = ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'];
    const exportFormat = 'CSV';

    const result = await validateCSVExportInputs({
      selectedDiscrepancyIds,
      exportFormat,
    });

    expect(result.isValid).toBe(true);
    expect(result.validatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
