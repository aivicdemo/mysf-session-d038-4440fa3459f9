import { calculateAnnualLicenseCost, CalculationResultOverflow } from '../../src/logic/license-cost-calculation';

describe('SCEN-585: ライセンス種別ごとの年間費用が計算上の上限値を超えるとき、CalculationResultOverflow エラーが発生する', () => {
  it('should throw CalculationResultOverflow when calculation exceeds Number.MAX_SAFE_INTEGER', async () => {
    const contractDocument = {
      contractNumber: 'C007',
      contractStartDate: '2024-01-01',
      contractEndDate: '2024-12-31',
      licenseTypes: [{ licenseTypeName: 'Salesforce Professional', description: '' }],
    };

    const licenseManagementSheet = {
      sheetName: 'License Management',
      licenseAllocations: [
        {
          licenseTypeName: 'Salesforce Professional',
          userCount: 99999999999999,
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
      CalculationResultOverflow
    );
    await expect(calculateAnnualLicenseCost(input)).rejects.toThrow(
      '計算結果が上限値を超えています。入力データを確認してください。'
    );
  });
});
