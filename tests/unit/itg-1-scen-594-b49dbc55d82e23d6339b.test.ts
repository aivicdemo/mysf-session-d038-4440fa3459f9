import { calculateAnnualLicenseCost, CalculateAnnualLicenseCostInput } from '../../src/logic/license-cost-calculation';

describe('SCEN-594: 割引率が0未満または1を超えるとき', () => {
  it('割引率が-0.1（マイナス10%）のとき、エラーメッセージ「割引率は0～100%の範囲で指定してください」を発出する', async () => {
    const input: CalculateAnnualLicenseCostInput = {
      contractDocument: {
        contractNumber: 'CONTRACT-001',
        contractStartDate: '2024-01-01',
        contractEndDate: '2024-12-31',
        licenseTypes: [
          {
            licenseTypeName: 'Sales Cloud',
          },
        ],
      },
      licenseManagementSheet: {
        sheetName: 'license-sheet',
        licenseAllocations: [
          {
            licenseTypeName: 'Sales Cloud',
            userCount: 50,
            unitPricePerYear: 165,
          },
        ],
        lastUpdatedDate: '2024-01-01',
      },
      targetFiscalYear: '2024',
    };

    await expect(calculateAnnualLicenseCost(input)).rejects.toThrow('割引率は0～100%の範囲で指定してください');
  });
});
