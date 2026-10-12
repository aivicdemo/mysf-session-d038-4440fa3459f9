import { calculateAnnualLicenseCost, InvalidLicenseTypeDefinition } from '../../src/logic/license-cost-calculation';

describe('SCEN-577: 契約書のライセンス種別がライセンス管理表に存在しないとき、InvalidLicenseTypeDefinition エラーが発生する', () => {
  it('should throw InvalidLicenseTypeDefinition error when contract license type does not exist in sheet', async () => {
    const input = {
      contractDocument: {
        contractNumber: 'C001',
        contractStartDate: '2024-01-01',
        contractEndDate: '2024-12-31',
        licenseTypes: [
          { licenseTypeName: 'Sales Cloud' },
          { licenseTypeName: 'Service Cloud' },
          { licenseTypeName: 'Professional' },
        ],
      },
      licenseManagementSheet: {
        sheetName: 'License Sheet',
        licenseAllocations: [
          {
            licenseTypeName: 'Sales Cloud',
            userCount: 50,
            unitPricePerYear: 165,
          },
          {
            licenseTypeName: 'Service Cloud',
            userCount: 30,
            unitPricePerYear: 165,
          },
        ],
        lastUpdatedDate: '2024-01-15',
      },
      targetFiscalYear: '2024',
    };

    await expect(calculateAnnualLicenseCost(input)).rejects.toThrow(
      InvalidLicenseTypeDefinition
    );
    await expect(calculateAnnualLicenseCost(input)).rejects.toThrow(
      '契約書とライセンス管理表のライセンス種別定義が一致しません。データの整合性を確認してください。'
    );
  });
});
