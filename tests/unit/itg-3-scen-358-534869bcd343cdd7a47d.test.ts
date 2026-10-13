import { validateCSVExportInputs } from '../../src/logic/authorization-validation';

describe('SCEN-358: エラー系：差異IDにUUID形式でない値を含む場合、検証失敗となり「選択された差異IDの形式が不正です。」を返す', () => {
  it('UUID形式でない値を含む配列で検証失敗となり、isValidがfalseで返される', async () => {
    const result = await validateCSVExportInputs({
      selectedDiscrepancyIds: [
        '123e4567-e89b-12d3-a456-42661417400',
        'not-a-uuid',
        '',
      ],
      exportFormat: 'CSV',
    });

    expect(result.isValid).toBe(false);
    expect(result.validatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
