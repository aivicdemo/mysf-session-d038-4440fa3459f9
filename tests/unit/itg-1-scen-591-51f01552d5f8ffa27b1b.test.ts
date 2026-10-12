import { calculateAnnualLicenseCost } from '../../src/logic/license-cost-calculation';

describe('SCEN-591: ライセンスカタログ・割引率・保守費用割合から、ライセンス種別ごとの小計、割引前合計、割引額、割引後合計、保守費用、年間総ライセス料を正確に計算できる', () => {
  it('should calculate annual license cost with discount and maintenance fees according to business rule br-tx_8-001', async () => {
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
            licenseTypeName: 'Essentials',
            description: undefined
          }
        ]
      },
      licenseManagementSheet: {
        sheetName: 'License Data 2024',
        licenseAllocations: [
          {
            licenseTypeName: 'Sales Cloud',
            userCount: 50,
            unitPricePerYear: 16500
          },
          {
            licenseTypeName: 'Service Cloud',
            userCount: 30,
            unitPricePerYear: 11000
          },
          {
            licenseTypeName: 'Essentials',
            userCount: 20,
            unitPricePerYear: 3300
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
    expect(salesCloudDetail?.annualCostPerType).toBe(825000);

    const serviceCloudDetail = result.licenseTypeCosts.find(
      (detail) => detail.licenseTypeName === 'Service Cloud'
    );
    expect(serviceCloudDetail).toBeDefined();
    expect(serviceCloudDetail?.annualCostPerType).toBe(330000);

    const essentialsDetail = result.licenseTypeCosts.find(
      (detail) => detail.licenseTypeName === 'Essentials'
    );
    expect(essentialsDetail).toBeDefined();
    expect(essentialsDetail?.annualCostPerType).toBe(66000);

    const subtotalBeforeDiscount = 825000 + 330000 + 66000;
    const discountRate = 0.1;
    const discountAmount = subtotalBeforeDiscount * discountRate;
    const subtotalAfterDiscount = subtotalBeforeDiscount - discountAmount;
    const maintenanceFeeRate = 0.15;
    const maintenanceFee = subtotalAfterDiscount * maintenanceFeeRate;
    const totalAnnualLicenseCost =
      subtotalAfterDiscount + maintenanceFee;

    expect(result.totalAnnualLicenseCost).toBe(1263735);

    expect(result.calculationDate).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?(\+\d{2}:\d{2})?$/
    );
    expect(result.targetFiscalYear).toBe('2024');
  });
});
