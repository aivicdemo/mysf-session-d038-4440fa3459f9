import { calculateAnnualLicenseCost, CalculateAnnualLicenseCostInput } from '../../src/logic/license-cost-calculation';

describe('SCEN-595: 保守費用割合が0未満または1を超えるとき', () => {
  it('保守費用割合が-0.1のとき、エラーメッセージ「保守費用割合は0～100%の範囲で指定してください」を発出する', async () => {
    const input: CalculateAnnualLicenseCostInput = {
      contractDocument: {
        contractNumber: 'CONTRACT-001',
        contractStartDate: '2024-01-01',
        contractEndDate: '2024-12-31',
        licenseTypes: [
          {
            licenseTypeName: 'Sales Cloud',
          },
        ],
      },
      licenseManagementSheet: {
        sheetName: 'license-sheet',
        licenseAllocations: [
          {
            licenseTypeName: 'Sales Cloud',
            userCount: 50,
            unitPricePerYear: 165,
          },
        ],
        lastUpdatedDate: '2024-01-01',
      },
      targetFiscalYear: '2024',
    };

    await expect(calculateAnnualLicenseCost(input)).rejects.toThrow('保守費用割合は0～100%の範囲で指定してください');
  });
});
