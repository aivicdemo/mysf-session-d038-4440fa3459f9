import { calculateAnnualLicenseCost } from '../../src/logic/license-cost-calculation';
import type { CalculateAnnualLicenseCostInput, CalculateAnnualLicenseCostOutput } from '../../src/logic/license-cost-calculation';

describe('SCEN-572: Calculate annual license cost with matching contract and sheet', () => {
  it('should calculate annual license costs correctly when both contract and license sheet are provided with matching license types and positive values', async () => {
    const input: CalculateAnnualLicenseCostInput = {
      contractDocument: {
        contractNumber: 'SF-2024-001',
        contractStartDate: '2024-01-01',
        contractEndDate: '2024-12-31',
        licenseTypes: [
          { licenseTypeName: 'Salesforce Essentials' },
          { licenseTypeName: 'Salesforce Professional' },
          { licenseTypeName: 'Salesforce Enterprise' },
        ],
      },
      licenseManagementSheet: {
        sheetName: 'License Sheet 2024',
        lastUpdatedDate: '2024-01-01',
        licenseAllocations: [
          {
            licenseTypeName: 'Salesforce Essentials',
            userCount: 10,
            unitPricePerYear: 165,
          },
          {
            licenseTypeName: 'Salesforce Professional',
            userCount: 20,
            unitPricePerYear: 330,
          },
          {
            licenseTypeName: 'Salesforce Enterprise',
            userCount: 5,
            unitPricePerYear: 495,
          },
        ],
      },
      targetFiscalYear: '2024',
    };

    const result: CalculateAnnualLicenseCostOutput = await calculateAnnualLicenseCost(input);

    // Verify licenseTypeCosts array has 3 items
    expect(result.licenseTypeCosts).toHaveLength(3);

    // Verify Essentials: 10 × 165 × 12 = 19,800
    const essentials = result.licenseTypeCosts.find(
      (c) => c.licenseTypeName === 'Salesforce Essentials'
    );
    expect(essentials).toBeDefined();
    expect(essentials!.userCount).toBe(10);
    expect(essentials!.unitPricePerYear).toBe(165);
    expect(essentials!.annualCostPerType).toBe(19800);

    // Verify Professional: 20 × 330 × 12 = 79,200
    const professional = result.licenseTypeCosts.find(
      (c) => c.licenseTypeName === 'Salesforce Professional'
    );
    expect(professional).toBeDefined();
    expect(professional!.userCount).toBe(20);
    expect(professional!.unitPricePerYear).toBe(330);
    expect(professional!.annualCostPerType).toBe(79200);

    // Verify Enterprise: 5 × 495 × 12 = 29,700
    const enterprise = result.licenseTypeCosts.find(
      (c) => c.licenseTypeName === 'Salesforce Enterprise'
    );
    expect(enterprise).toBeDefined();
    expect(enterprise!.userCount).toBe(5);
    expect(enterprise!.unitPricePerYear).toBe(495);
    expect(enterprise!.annualCostPerType).toBe(29700);

    // Verify subtotal: 19,800 + 79,200 + 29,700 = 128,700
    // Discount: 128,700 × 0.1 = 12,870
    // After discount: 128,700 - 12,870 = 115,830
    // Support fee: 115,830 × 0.05 = 5,791.50
    // Total: 115,830 + 5,791.50 = 121,621.50
    expect(result.totalAnnualLicenseCost).toBe(121621.5);

    // Verify targetFiscalYear
    expect(result.targetFiscalYear).toBe('2024');

    // Verify calculationDate is in ISO 8601 format
    expect(result.calculationDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
  });
});
