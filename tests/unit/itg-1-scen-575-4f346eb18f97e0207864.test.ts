import { calculateAnnualLicenseCost, ContractDocumentNotProvided } from '../../src/logic/license-cost-calculation';

describe('SCEN-575: ライセンス管理表が提供されていないとき、LicenseManagementSheetNotProvided エラーが発生する', () => {
  it('should throw ContractDocumentNotProvided error when contractDocument is null', async () => {
    const input = {
      contractDocument: null,
      licenseManagementSheet: {
        sheetName: 'License Sheet',
        licenseAllocations: [
          {
            licenseTypeName: 'Sales Cloud',
            userCount: 50,
            unitPricePerYear: 165,
          },
        ],
        lastUpdatedDate: '2024-01-15',
      },
      targetFiscalYear: '2024',
    };

    await expect(calculateAnnualLicenseCost(input)).rejects.toThrow(
      ContractDocumentNotProvided
    );
    await expect(calculateAnnualLicenseCost(input)).rejects.toThrow(
      'Salesforce契約書が提供されていません。営業部システム担当に契約書の提供を依頼してください。'
    );
  });
});
