import { validateCSVExportInputs } from '../../src/logic/authorization-validation';

describe('SCEN-356: 正常系：UUID形式の差異ID 1件とCSV形式を指定した場合、検証成功となり現在日時を含むレスポンスを返す', () => {
  it('UUID形式の差異ID 1件とCSV形式で検証成功となり、isValidがtrueで日時が返される', async () => {
    const result = await validateCSVExportInputs({
      selectedDiscrepancyIds: ['550e8400-e29b-41d4-a716-446655440000'],
      exportFormat: 'CSV',
    });

    expect(result.isValid).toBe(true);
    expect(result.validatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
