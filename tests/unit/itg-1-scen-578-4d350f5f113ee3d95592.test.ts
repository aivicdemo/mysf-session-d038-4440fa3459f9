import { calculateAnnualLicenseCost, InvalidLicenseTypeDefinition } from '../../src/logic/license-cost-calculation';

describe('SCEN-578: ライセンス管理表のライセンス種別が契約書に存在しないとき、InvalidLicenseTypeDefinition エラーが発生する', () => {
  it('should throw InvalidLicenseTypeDefinition error when sheet license type does not exist in contract', async () => {
    const input = {
      contractDocument: {
        contractNumber: 'C001',
        contractStartDate: '2024-01-01',
        contractEndDate: '2024-12-31',
        licenseTypes: [
          { licenseTypeName: 'Salesforce Essentials' },
          { licenseTypeName: 'Professional' },
        ],
      },
      licenseManagementSheet: {
        sheetName: 'License Sheet',
        licenseAllocations: [
          {
            licenseTypeName: 'Enterprise',
            userCount: 10,
            unitPricePerYear: 15000,
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
