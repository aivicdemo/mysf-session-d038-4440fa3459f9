import { calculateAnnualLicenseCost, CalculationResultOverflow } from '../../src/logic/license-cost-calculation';

describe('SCEN-586: CalculationResultOverflow error when total annual license cost exceeds calculation limit', () => {
  it('should throw CalculationResultOverflow when combining large license costs exceeds the limit', async () => {
    const input = {
      contractDocument: {
        contractNumber: 'SF-2024-001',
        contractStartDate: '2024-01-01',
        contractEndDate: '2024-12-31',
        licenseTypes: [
          { licenseTypeName: 'Sales Cloud', description: 'Sales Cloud license' },
          { licenseTypeName: 'Service Cloud', description: 'Service Cloud license' },
        ],
      },
      licenseManagementSheet: {
        sheetName: 'License Allocation',
        licenseAllocations: [
          {
            licenseTypeName: 'Sales Cloud',
            userCount: 9007199254740991,
            unitPricePerYear: 9007199254740991,
          },
          {
            licenseTypeName: 'Service Cloud',
            userCount: 9007199254740991,
            unitPricePerYear: 9007199254740991,
          },
        ],
        lastUpdatedDate: '2024-01-01',
      },
      targetFiscalYear: '2024',
    };

    await expect(calculateAnnualLicenseCost(input)).rejects.toThrow(CalculationResultOverflow);
    await expect(calculateAnnualLicenseCost(input)).rejects.toThrow(
      '計算結果が上限値を超えています。入力データを確認してください。'
    );
  });
});
