import { calculateAnnualLicenseCost, InvalidUserCountOrUnitPrice } from '../../src/logic/license-cost-calculation';

describe('SCEN-579: ライセンス管理表のユーザー数がゼロのとき、InvalidUserCountOrUnitPrice エラーが発生する', () => {
  it('should throw InvalidUserCountOrUnitPrice when userCount is 0', async () => {
    const contractDocument = {
      contractNumber: 'C001',
      contractStartDate: '2024-01-01',
      contractEndDate: '2024-12-31',
      licenseTypes: [{ licenseTypeName: 'Sales Cloud', description: '' }],
    };

    const licenseManagementSheet = {
      sheetName: 'License Management',
      licenseAllocations: [
        {
          licenseTypeName: 'Sales Cloud',
          userCount: 0,
          unitPricePerYear: 165,
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
