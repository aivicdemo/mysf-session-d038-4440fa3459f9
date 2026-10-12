import { calculateAnnualLicenseCost, ContractDocumentNotProvided } from '../../src/logic/license-cost-calculation';
import type { CalculateAnnualLicenseCostInput } from '../../src/logic/license-cost-calculation';

describe('SCEN-573: Contract document not provided error', () => {
  it('should throw ContractDocumentNotProvided error when contract document is null', async () => {
    const input: CalculateAnnualLicenseCostInput = {
      contractDocument: null,
      licenseManagementSheet: {
        sheetName: 'License Sheet',
        lastUpdatedDate: '2024-01-01',
        licenseAllocations: [
          {
            licenseTypeName: 'Salesforce Essentials',
            userCount: 10,
            unitPricePerYear: 3000,
          },
        ],
      },
      targetFiscalYear: '2024',
    };

    await expect(calculateAnnualLicenseCost(input)).rejects.toThrow(
      ContractDocumentNotProvided
    );
    await expect(calculateAnnualLicenseCost(input)).rejects.toThrow(
      'Salesforce契約書が提供されていません。営業部システム担当に契約書の提供を依頼してください。'
    );
  });
});
