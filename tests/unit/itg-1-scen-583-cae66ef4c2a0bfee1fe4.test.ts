import { calculateAnnualLicenseCost, InvalidUserCountOrUnitPrice } from '../../src/logic/license-cost-calculation';

describe('SCEN-583: ライセンス管理表のユーザー数が非数値のとき、InvalidUserCountOrUnitPrice エラーが発生する', () => {
  it('should throw InvalidUserCountOrUnitPrice when userCount is non-numeric', async () => {
    const contractDocument = {
      contractNumber: 'C005',
      contractStartDate: '2024-01-01',
      contractEndDate: '2024-12-31',
      licenseTypes: [
        { licenseTypeName: 'Sales Cloud', description: '' },
        { licenseTypeName: 'Service Cloud', description: '' },
      ],
    };

    const licenseManagementSheet = {
      sheetName: 'License Management',
      licenseAllocations: [
        {
          licenseTypeName: 'Sales Cloud',
          userCount: 'abc' as any,
          unitPricePerYear: 165,
        },
        {
          licenseTypeName: 'Service Cloud',
          userCount: 30,
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
