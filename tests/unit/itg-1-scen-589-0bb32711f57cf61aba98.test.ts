import { calculateAnnualLicenseCost } from '../../src/logic/license-cost-calculation';

describe('SCEN-589: 計算対象の会計年度が出力に含まれる', () => {
  it('should return targetFiscalYear matching input', async () => {
    const input = {
      contractDocument: {
        contractNumber: 'CON-2024-001',
        contractStartDate: '2024-01-01',
        contractEndDate: '2024-12-31',
        licenseTypes: [
          {
            licenseTypeName: 'Salesforce Essentials',
            description: undefined
          },
          {
            licenseTypeName: 'Salesforce Professional',
            description: undefined
          }
        ]
      },
      licenseManagementSheet: {
        sheetName: 'License Sheet 2024',
        licenseAllocations: [
          {
            licenseTypeName: 'Salesforce Essentials',
            userCount: 10,
            unitPricePerYear: 3300
          },
          {
            licenseTypeName: 'Salesforce Professional',
            userCount: 5,
            unitPricePerYear: 9900
          }
        ],
        lastUpdatedDate: '2024-01-15'
      },
      targetFiscalYear: '2024'
    };

    const result = await calculateAnnualLicenseCost(input);

    expect(result.targetFiscalYear).toBe('2024');
    expect(result.licenseTypeCosts).toHaveLength(2);

    const essentialsDetail = result.licenseTypeCosts.find(
      (detail) => detail.licenseTypeName === 'Salesforce Essentials'
    );
    expect(essentialsDetail).toBeDefined();
    expect(essentialsDetail?.annualCostPerType).toBe(39600);

    const professionalDetail = result.licenseTypeCosts.find(
      (detail) => detail.licenseTypeName === 'Salesforce Professional'
    );
    expect(professionalDetail).toBeDefined();
    expect(professionalDetail?.annualCostPerType).toBe(49500);

    expect(result.totalAnnualLicenseCost).toBe(89100);
  });
});
