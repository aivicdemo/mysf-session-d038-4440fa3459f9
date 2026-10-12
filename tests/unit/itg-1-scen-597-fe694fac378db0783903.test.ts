import { calculateAnnualLicenseCost, ContractDocumentNotProvided } from '../../src/logic/license-cost-calculation';
import type { CalculateAnnualLicenseCostInput, LicenseManagementSheetData } from '../../src/logic/license-cost-calculation';

describe('SCEN-597: 契約書またはライセンス管理画面が提供されていないとき、指定エラーメッセージを発出する', () => {
  it('contractDocument が null のとき、ContractDocumentNotProvided エラーを発出する', async () => {
    // 前提条件: contractDocument = null
    const licenseManagementSheet: LicenseManagementSheetData = {
      sheetName: 'License Management 2024-01-15',
      lastUpdatedDate: '2024-01-15',
      licenseAllocations: [
        {
          licenseTypeName: 'Sales Cloud',
          userCount: 50,
          unitPricePerYear: 165
        }
      ]
    };

    const input: CalculateAnnualLicenseCostInput = {
      contractDocument: null,
      licenseManagementSheet,
      targetFiscalYear: '2024'
    };

    // 関数がエラーを発出することを確認
    await expect(calculateAnnualLicenseCost(input)).rejects.toThrow(ContractDocumentNotProvided);

    // エラーメッセージが指定のものであることを確認
    await expect(calculateAnnualLicenseCost(input)).rejects.toThrow(
      'Salesforce契約書が提供されていません。営業部システム担当に契約書の提供を依頼してください。'
    );
  });
});
