import { calculateAnnualLicenseCost, InvalidUserCountOrUnitPrice } from '../../src/logic/license-cost-calculation';

describe('SCEN-582: ライセンス管理表の単価が負数のとき、InvalidUserCountOrUnitPrice エラーが発生する', () => {
  it('should throw InvalidUserCountOrUnitPrice when unitPrice is negative', async () => {
    const contractDocument = {
      contractNumber: 'C004',
      contractStartDate: '2024-04-01',
      contractEndDate: '2025-03-31',
      licenseTypes: [
        { licenseTypeName: 'Salesforce Essentials', description: '' },
        { licenseTypeName: 'Salesforce Professional', description: '' },
      ],
    };

    const licenseManagementSheet = {
      sheetName: 'License Management',
      licenseAllocations: [
        {
          licenseTypeName: 'Salesforce Essentials',
          userCount: 10,
          unitPricePerYear: -500,
        },
        {
          licenseTypeName: 'Salesforce Professional',
          userCount: 5,
          unitPricePerYear: 1000,
        },
      ],
      lastUpdatedDate: '2024-04-01',
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
