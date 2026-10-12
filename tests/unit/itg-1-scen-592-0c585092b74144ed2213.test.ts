import { calculateAnnualLicenseCost, ContractDocumentNotProvided, CalculateAnnualLicenseCostInput } from '../../src/logic/license-cost-calculation';

describe('SCEN-592: ライセンス種別が空またはヌルのとき', () => {
  it('contractDocumentがnullのとき、ContractDocumentNotProvidedエラーを発出する', async () => {
    const input: CalculateAnnualLicenseCostInput = {
      contractDocument: null,
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

    await expect(calculateAnnualLicenseCost(input)).rejects.toThrow('Salesforce契約書が提供されていません。営業部システム担当に契約書の提供を依頼してください。');
  });
});
