import { calculateAnnualLicenseCost } from '../../src/logic/license-cost-calculation';

describe('SCEN-588: 計算実行日時が ISO 8601 形式で出力に含まれる', () => {
  it('should return calculationDate in ISO 8601 format', async () => {
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
            licenseTypeName: 'Professional',
            description: undefined
          }
        ]
      },
      licenseManagementSheet: {
        sheetName: 'License Allocation 2024',
        licenseAllocations: [
          {
            licenseTypeName: 'Salesforce Essentials',
            userCount: 10,
            unitPricePerYear: 120
          },
          {
            licenseTypeName: 'Professional',
            userCount: 5,
            unitPricePerYear: 165
          }
        ],
        lastUpdatedDate: '2024-01-15'
      },
      targetFiscalYear: '2024'
    };

    const result = await calculateAnnualLicenseCost(input);

    expect(result.calculationDate).toBeDefined();
    expect(typeof result.calculationDate).toBe('string');

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?(\+\d{2}:\d{2})?$/;
    expect(result.calculationDate).toMatch(iso8601Regex);
  });
});
