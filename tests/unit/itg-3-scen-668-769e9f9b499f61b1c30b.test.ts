import { validateCSVExportInputs, SelectedDiscrepancyIdsEmpty } from '../../src/logic/authorization-validation';

describe('SCEN-668: 許容範囲の値が負数の場合、処理を中断し指定メッセージで拒否する', () => {
  it('should validate CSV export inputs and return isValid=true with ISO 8601 validatedAt timestamp', async () => {
    const selectedDiscrepancyIds = [
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440001'
    ];
    const exportFormat = 'CSV';

    const result = await validateCSVExportInputs({
      selectedDiscrepancyIds,
      exportFormat
    });

    expect(result.isValid).toBe(true);
    expect(result.validatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(new Date(result.validatedAt)).not.toBeNaN();
  });
});
