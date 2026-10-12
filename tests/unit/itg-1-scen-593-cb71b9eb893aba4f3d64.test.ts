import { calculateAnnualLicenseCost, InvalidUserCountOrUnitPrice, CalculateAnnualLicenseCostInput } from '../../src/logic/license-cost-calculation';

describe('SCEN-593: 単価または購入数量が負数のとき', () => {
  it('licenseManagementSheetの単価が負数のとき、InvalidUserCountOrUnitPriceエラーを発出する', async () => {
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
            unitPricePerYear: -165,
          },
        ],
        lastUpdatedDate: '2024-01-01',
      },
      targetFiscalYear: '2024',
    };

    await expect(calculateAnnualLicenseCost(input)).rejects.toThrow('ライセンス管理表のユーザー数または単価が不正です。正の数値を入力してください。');
  });
});
