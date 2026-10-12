import { calculateAnnualLicenseCost, LicenseManagementSheetNotProvided } from '../../src/logic/license-cost-calculation';
import type { CalculateAnnualLicenseCostInput, SalesforceContractDocument, LicenseManagementSheetData } from '../../src/logic/license-cost-calculation';

describe('SCEN-598: 過去12ヶ月の請求書が1件も提供されていないとき、指定エラーメッセージを発出する', () => {
  it('licenseManagementSheet が null のとき、エラーを発出する', async () => {
    // 前提条件: contractDocument と licenseManagementSheet の両方またはどちらかが提供されていない
    const contractDocument: SalesforceContractDocument = {
      contractNumber: 'SF-CONTRACT-2024-001',
      contractStartDate: '2024-01-01',
      contractEndDate: '2024-12-31',
      licenseTypes: [
        {
          licenseTypeName: 'Sales Cloud',
          description: 'Sales Cloud License'
        }
      ]
    };

    const input: CalculateAnnualLicenseCostInput = {
      contractDocument,
      licenseManagementSheet: null,
      targetFiscalYear: '2024'
    };

    // 関数がエラーを発出することを確認
    // 仕様の期待結果より「過去12ヶ月分の請求書が必要です」が返される
    await expect(calculateAnnualLicenseCost(input)).rejects.toThrow();

    const error = await calculateAnnualLicenseCost(input).catch((e) => e);
    expect(error.message).toContain('過去12ヶ月分の請求書が必要です');
  });
});
