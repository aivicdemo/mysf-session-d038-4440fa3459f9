import { validateCSVExportInputs, SelectedDiscrepancyIdsEmpty } from '../../src/logic/authorization-validation';

describe('SCEN-357: エラー系：差異IDが空配列の場合、検証失敗となり「CSV出力対象の差異レコードが選択されていません。1件以上選択してください。」を返す', () => {
  it('空配列の差異IDで検証失敗となり、SelectedDiscrepancyIdsEmptyエラーが返される', async () => {
    const result = await validateCSVExportInputs({
      selectedDiscrepancyIds: [],
      exportFormat: 'CSV',
    });

    expect(result.isValid).toBe(false);
    expect(result.validatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
