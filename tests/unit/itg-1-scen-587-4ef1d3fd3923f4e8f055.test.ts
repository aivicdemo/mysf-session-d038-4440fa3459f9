import { calculateAnnualLicenseCost } from '../../src/logic/license-cost-calculation';

describe('SCEN-587: 複数のライセンス種別が存在するとき、それぞれの年間費用を個別に計算して licenseTypeCosts に含める', () => {
  it('should calculate individual license type costs and include in licenseTypeCosts', async () => {
    const contractDocument = {
      contractNumber: 'SFDC-2024-001',
      contractStartDate: '2024-04-01',
      contractEndDate: '2025-03-31',
      licenseTypes: [
        { licenseTypeName: 'Salesforce Essentials', description: '' },
        { licenseTypeName: 'Salesforce Professional', description: '' },
        { licenseTypeName: 'Salesforce Enterprise', description: '' },
      ],
    };

    const licenseManagementSheet = {
      sheetName: 'License Breakdown',
      licenseAllocations: [
        {
          licenseTypeName: 'Salesforce Essentials',
          userCount: 10,
          unitPricePerYear: 1500,
        },
        {
          licenseTypeName: 'Salesforce Professional',
          userCount: 15,
          unitPricePerYear: 3000,
        },
        {
          licenseTypeName: 'Salesforce Enterprise',
          userCount: 5,
          unitPricePerYear: 6000,
        },
      ],
      lastUpdatedDate: '2024-01-15',
    };

    const input = {
      contractDocument,
      licenseManagementSheet,
      targetFiscalYear: '2024',
    };

    const result = await calculateAnnualLicenseCost(input);

    expect(result.licenseTypeCosts).toHaveLength(3);

    expect(result.licenseTypeCosts[0]).toEqual({
      licenseTypeName: 'Salesforce Essentials',
      userCount: 10,
      unitPricePerYear: 1500,
      annualCostPerType: 180000,
    });

    expect(result.licenseTypeCosts[1]).toEqual({
      licenseTypeName: 'Salesforce Professional',
      userCount: 15,
      unitPricePerYear: 3000,
      annualCostPerType: 540000,
    });

    expect(result.licenseTypeCosts[2]).toEqual({
      licenseTypeName: 'Salesforce Enterprise',
      userCount: 5,
      unitPricePerYear: 6000,
      annualCostPerType: 360000,
    });

    expect(result.totalAnnualLicenseCost).toBe(1080000);
    expect(result.targetFiscalYear).toBe('2024');
    expect(result.calculationDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
