import { calculateAnnualLicenseCost, InvalidUserCountOrUnitPrice } from '../../src/logic/license-cost-calculation';

describe('SCEN-580: ライセンス管理表のユーザー数が負数のとき、InvalidUserCountOrUnitPrice エラーが発生する', () => {
  it('should throw InvalidUserCountOrUnitPrice when userCount is negative', async () => {
    const contractDocument = {
      contractNumber: 'C002',
      contractStartDate: '2024-01-01',
      contractEndDate: '2024-12-31',
      licenseTypes: [
        { licenseTypeName: 'Salesforce Essentials', description: '' },
        { licenseTypeName: 'Professional', description: '' },
      ],
    };

    const licenseManagementSheet = {
      sheetName: 'License Management',
      licenseAllocations: [
        {
          licenseTypeName: 'Salesforce Essentials',
          userCount: -2,
          unitPricePerYear: 165,
        },
        {
          licenseTypeName: 'Professional',
          userCount: 5,
          unitPricePerYear: 330,
        },
      ],
      lastUpdatedDate: '2024-01-01',
    };

    const input = {
      contractDocument,
      licenseManagementSheet,
      targetFiscalYear: '2024',
    };

    await expect(calculateAnnualLicenseCost(input)).rejects.toThrow(
      InvalidUserCountOrUnitPrice
    );
    await expect(calculateAnnualLicenseCost(input)).rejects.toThrow(
      'ライセンス管理表のユーザー数または単価が不正です。正の数値を入力してください。'
    );
  });
});
