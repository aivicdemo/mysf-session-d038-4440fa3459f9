import { validateCSVExportInputs, SelectedDiscrepancyIdsEmpty } from '../../src/logic/authorization-validation';

describe('SCEN-657: CSV出力対象として選択された差異レコードの入力値が不正な場合、リクエストを拒否する', () => {
  it('should throw SelectedDiscrepancyIdsEmpty error when selectedDiscrepancyIds is empty array', async () => {
    const selectedDiscrepancyIds: string[] = [];
    const exportFormat = 'CSV';

    const error = await validateCSVExportInputs({
      selectedDiscrepancyIds,
      exportFormat,
    }).catch(e => e);

    expect(error).toBeInstanceOf(SelectedDiscrepancyIdsEmpty);
  });
});
