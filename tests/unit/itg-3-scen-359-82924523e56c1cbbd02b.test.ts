import { validateCSVExportInputs } from '../../src/logic/authorization-validation';

describe('SCEN-359: エラー系：差異IDが空文字列を含む場合、検証失敗となり「選択された差異IDの形式が不正です。」を返す', () => {
  it('空文字列を含む配列で検証失敗となり、isValidがfalseで返される', async () => {
    const result = await validateCSVExportInputs({
      selectedDiscrepancyIds: [
        '550e8400-e29b-41d4-a716-446655440000',
        '',
        '550e8400-e29b-41d4-a716-446655440001',
      ],
      exportFormat: 'CSV',
    });

    expect(result.isValid).toBe(false);
    expect(result.validatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
