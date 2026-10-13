import { validateCSVExportInputs, SelectedDiscrepancyIdsEmpty } from '../../src/logic/authorization-validation';

describe('SCEN-670: データ差異の種類が空または不明な場合、是正方法判定を中断し指定メッセージで拒否する', () => {
  it('should reject empty selectedDiscrepancyIds and throw SelectedDiscrepancyIdsEmpty error with ISO 8601 timestamp', async () => {
    const selectedDiscrepancyIds: string[] = [];
    const exportFormat = 'CSV';

    await expect(
      validateCSVExportInputs({
        selectedDiscrepancyIds,
        exportFormat
      })
    ).rejects.toThrow(SelectedDiscrepancyIdsEmpty);
  });
});
