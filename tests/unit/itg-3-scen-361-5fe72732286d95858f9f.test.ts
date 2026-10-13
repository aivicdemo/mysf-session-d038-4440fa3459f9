import { validateCSVExportInputs } from '../../src/logic/authorization-validation';

describe('SCEN-361: エラー系：出力形式が「CSV」以外の値の場合、検証失敗となり「出力形式は \'CSV\' のみサポートされています。」を返す', () => {
  it('PDF形式で検証失敗となり、isValidがfalseで返される', async () => {
    const result = await validateCSVExportInputs({
      selectedDiscrepancyIds: [
        '550e8400-e29b-41d4-a716-446655440000',
        '550e8400-e29b-41d4-a716-446655440001',
      ],
      exportFormat: 'PDF',
    });

    expect(result.isValid).toBe(false);
    expect(result.validatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
