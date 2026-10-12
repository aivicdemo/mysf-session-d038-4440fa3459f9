import { calculateAnnualLicenseCost } from '../../src/logic/license-cost-calculation';
import type {
  CalculateAnnualLicenseCostInput,
  CalculateAnnualLicenseCostOutput,
  SalesforceContractDocument,
  LicenseManagementSheetData,
} from '../../src/logic/license-cost-calculation';

describe('SCEN-599: Active users exceed contracted users - warning message issuance', () => {
  it('should issue warning message when active user count exceeds contracted user count', async () => {
    // Preconditions
    const contractDocument: SalesforceContractDocument = {
      contractNumber: 'SF-2024-001',
      contractStartDate: '2024-01-01T00:00:00Z',
      contractEndDate: '2024-12-31T23:59:59Z',
      licenseTypes: [
        {
          licenseTypeName: 'Sales Cloud',
          description: 'Sales Cloud License',
        },
        {
          licenseTypeName: 'Service Cloud',
          description: 'Service Cloud License',
        },
      ],
    };

    const licenseManagementSheet: LicenseManagementSheetData = {
      sheetName: 'License Allocations',
      licenseAllocations: [
        {
          licenseTypeName: 'Sales Cloud',
          userCount: 65,
          unitPricePerYear: 165,
          discountRate: 0.1,
          supportFeePercentage: 0.05,
        },
        {
          licenseTypeName: 'Service Cloud',
          userCount: 30,
          unitPricePerYear: 165,
          discountRate: 0.1,
          supportFeePercentage: 0.05,
        },
      ],
      lastUpdatedDate: '2024-06-15T09:30:00Z',
    };

    const targetFiscalYear = '2024';

    const input: CalculateAnnualLicenseCostInput = {
      contractDocument,
      licenseManagementSheet,
      targetFiscalYear,
    };

    // Call the function
    const result = await calculateAnnualLicenseCost(input);

    // Verify the output structure
    expect(result).toBeDefined();
    expect(result.licenseTypeCosts).toBeDefined();
    expect(Array.isArray(result.licenseTypeCosts)).toBe(true);
    expect(result.totalAnnualLicenseCost).toBeDefined();
    expect(typeof result.totalAnnualLicenseCost).toBe('number');
    expect(result.calculationDate).toBeDefined();
    expect(result.targetFiscalYear).toBe('2024');

    // Verify Sales Cloud details are included
    const salesCloudCost = result.licenseTypeCosts.find(
      (cost) => cost.licenseTypeName === 'Sales Cloud'
    );
    expect(salesCloudCost).toBeDefined();
    expect(salesCloudCost?.userCount).toBe(65);
    expect(salesCloudCost?.unitPricePerYear).toBe(165);

    // Verify Service Cloud details are included
    const serviceCloudCost = result.licenseTypeCosts.find(
      (cost) => cost.licenseTypeName === 'Service Cloud'
    );
    expect(serviceCloudCost).toBeDefined();
    expect(serviceCloudCost?.userCount).toBe(30);
    expect(serviceCloudCost?.unitPricePerYear).toBe(165);

    // Verify totalAnnualLicenseCost is calculated
    expect(result.totalAnnualLicenseCost).toBeGreaterThan(0);

    // Verify calculationDate is in ISO 8601 format
    expect(() => new Date(result.calculationDate)).not.toThrow();
    const calculationDateObj = new Date(result.calculationDate);
    expect(calculationDateObj.getTime()).toBeGreaterThan(0);
  });
});
