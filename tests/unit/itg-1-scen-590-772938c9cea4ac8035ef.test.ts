import { calculateAnnualLicenseCost } from '../../src/logic/license-cost-calculation';

describe('SCEN-590: ライセンス種別が複数のとき、合計年間ライセス料がすべての種別の年間費用の合計と一致する', () => {
  it('should calculate correct total annual license cost with multiple license types', async () => {
    const input = {
      contractDocument: {
        contractNumber: 'CON-2024-001',
        contractStartDate: '2024-01-01',
        contractEndDate: '2024-12-31',
        licenseTypes: [
          {
            licenseTypeName: 'Sales Cloud',
            description: undefined
          },
          {
            licenseTypeName: 'Service Cloud',
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
            licenseTypeName: 'Sales Cloud',
            userCount: 50,
            unitPricePerYear: 16500
          },
          {
            licenseTypeName: 'Service Cloud',
            userCount: 30,
            unitPricePerYear: 16500
          },
          {
            licenseTypeName: 'Professional',
            userCount: 20,
            unitPricePerYear: 9900
          }
        ],
        lastUpdatedDate: '2024-01-15'
      },
      targetFiscalYear: '2024'
    };

    const result = await calculateAnnualLicenseCost(input);

    expect(result.licenseTypeCosts).toHaveLength(3);

    const salesCloudDetail = result.licenseTypeCosts.find(
      (detail) => detail.licenseTypeName === 'Sales Cloud'
    );
    expect(salesCloudDetail).toBeDefined();
    expect(salesCloudDetail?.userCount).toBe(50);
    expect(salesCloudDetail?.unitPricePerYear).toBe(16500);
    expect(salesCloudDetail?.annualCostPerType).toBe(825000);

    const serviceCloudDetail = result.licenseTypeCosts.find(
      (detail) => detail.licenseTypeName === 'Service Cloud'
    );
    expect(serviceCloudDetail).toBeDefined();
    expect(serviceCloudDetail?.userCount).toBe(30);
    expect(serviceCloudDetail?.unitPricePerYear).toBe(16500);
    expect(serviceCloudDetail?.annualCostPerType).toBe(495000);

    const professionalDetail = result.licenseTypeCosts.find(
      (detail) => detail.licenseTypeName === 'Professional'
    );
    expect(professionalDetail).toBeDefined();
    expect(professionalDetail?.userCount).toBe(20);
    expect(professionalDetail?.unitPricePerYear).toBe(9900);
    expect(professionalDetail?.annualCostPerType).toBe(198000);

    expect(result.totalAnnualLicenseCost).toBe(1518000);
    expect(result.calculationDate).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?(\+\d{2}:\d{2})?$/
    );
    expect(result.targetFiscalYear).toBe('2024');
  });
});
