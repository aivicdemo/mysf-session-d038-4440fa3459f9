import { validateCSVExportInputs, SelectedDiscrepancyIdsEmpty } from '../../src/logic/authorization-validation';

describe('SCEN-672: validateCSVExportInputs with empty selectedDiscrepancyIds', () => {
  it('should reject with SelectedDiscrepancyIdsEmpty error when selectedDiscrepancyIds is empty array', async () => {
    const selectedDiscrepancyIds: string[] = [];
    const exportFormat = 'CSV';

    await expect(
      validateCSVExportInputs({
        selectedDiscrepancyIds,
        exportFormat,
      })
    ).rejects.toThrow(SelectedDiscrepancyIdsEmpty);
  });
});
