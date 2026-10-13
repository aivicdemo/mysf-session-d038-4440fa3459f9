import { validateCSVExportInputs, SelectedDiscrepancyIdsExceedsLimit } from '../../src/logic/authorization-validation';

describe('SCEN-360: SelectedDiscrepancyIdsExceedsLimit error', () => {
  it('should return validation failure when selectedDiscrepancyIds exceeds 10000 items', async () => {
    const selectedDiscrepancyIds = Array.from({ length: 10001 }, (_, i) => {
      const num = i.toString().padStart(2, '0');
      return `550e8400-e29b-41d4-a716-44665544${num}${num}`;
    });
    const exportFormat = 'CSV';

    await expect(
      validateCSVExportInputs({
        selectedDiscrepancyIds,
        exportFormat,
      })
    ).rejects.toThrow(SelectedDiscrepancyIdsExceedsLimit);

    try {
      await validateCSVExportInputs({
        selectedDiscrepancyIds,
        exportFormat,
      });
      fail('Should have thrown SelectedDiscrepancyIdsExceedsLimit error');
    } catch (error) {
      if (error instanceof SelectedDiscrepancyIdsExceedsLimit) {
        expect(error.message).toBe('一度に出力できる差異レコードは最大10000件です。');
      } else {
        throw error;
      }
    }
  });
});
