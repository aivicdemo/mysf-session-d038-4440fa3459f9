import { validateCSVExportInputs, ExportFormatInvalid } from '../../src/logic/authorization-validation';

describe('SCEN-363: validateCSVExportInputs - exportFormat が空文字列の場合のエラー', () => {
  it('exportFormat に空文字列を入力すると、検証失敗となり ExportFormatInvalid エラーが発生する', async () => {
    const input = {
      selectedDiscrepancyIds: [
        '550e8400-e29b-41d4-a716-446655440000',
        '550e8400-e29b-41d4-a716-446655440001'
      ],
      exportFormat: ''
    };

    await expect(validateCSVExportInputs(input)).rejects.toThrow(ExportFormatInvalid);
  });

  it('エラーメッセージが「出力形式は \'CSV\' のみサポートされています。」である', async () => {
    const input = {
      selectedDiscrepancyIds: [
        '550e8400-e29b-41d4-a716-446655440000',
        '550e8400-e29b-41d4-a716-446655440001'
      ],
      exportFormat: ''
    };

    await expect(validateCSVExportInputs(input)).rejects.toThrow('出力形式は \'CSV\' のみサポートされています。');
  });
});
