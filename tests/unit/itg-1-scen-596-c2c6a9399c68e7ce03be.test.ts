import { calculateAnnualLicenseCost } from '../../src/logic/license-cost-calculation';
import type { CalculateAnnualLicenseCostInput, SalesforceContractDocument, LicenseManagementSheetData } from '../../src/logic/license-cost-calculation';

describe('SCEN-596: Salesforce契約書、ライセンス管理画面、過去12ヶ月の請求書から、アクティブユーザー数、ライセンス種別ごとのユーザー数と単価、年間ライセンス料、年間保守費用、3年間の累積コストを正確に抽出・計算できる', () => {
  it('contractDocument、licenseManagementSheet、targetFiscalYearを入力値として呼び出し、ライセンス種別ごとのユーザー数と単価、年間ライセンス料の合計を計算できる', async () => {
    // 前提条件の設定
    const contractDocument: SalesforceContractDocument = {
      contractNumber: 'SF-CONTRACT-2024-001',
      contractStartDate: '2024-01-01',
      contractEndDate: '2024-12-31',
      licenseTypes: [
        {
          licenseTypeName: 'Sales Cloud',
          description: 'Sales Cloud License'
        },
        {
          licenseTypeName: 'Service Cloud',
          description: 'Service Cloud License'
        }
      ]
    };

    const licenseManagementSheet: LicenseManagementSheetData = {
      sheetName: 'License Management 2024-11-15',
      lastUpdatedDate: '2024-11-15',
      licenseAllocations: [
        {
          licenseTypeName: 'Sales Cloud',
          userCount: 50,
          unitPricePerYear: 27500
        },
        {
          licenseTypeName: 'Service Cloud',
          userCount: 30,
          unitPricePerYear: 22000
        }
      ]
    };

    const targetFiscalYear = '2024';

    const input: CalculateAnnualLicenseCostInput = {
      contractDocument,
      licenseManagementSheet,
      targetFiscalYear
    };

    // 関数を呼び出す
    const result = await calculateAnnualLicenseCost(input);

    // 期待結果を検証
    // Sales Cloud: 50 × 27500 = 1,375,000
    // Service Cloud: 30 × 22000 = 660,000
    // 合計: 2,035,000

    expect(result.licenseTypeCosts).toHaveLength(2);

    // Sales Cloud の検証
    const salesCloudCost = result.licenseTypeCosts.find(
      (cost) => cost.licenseTypeName === 'Sales Cloud'
    );
    expect(salesCloudCost).toBeDefined();
    expect(salesCloudCost?.userCount).toBe(50);
    expect(salesCloudCost?.unitPricePerYear).toBe(27500);
    expect(salesCloudCost?.annualCostPerType).toBe(1375000);

    // Service Cloud の検証
    const serviceCloudCost = result.licenseTypeCosts.find(
      (cost) => cost.licenseTypeName === 'Service Cloud'
    );
    expect(serviceCloudCost).toBeDefined();
    expect(serviceCloudCost?.userCount).toBe(30);
    expect(serviceCloudCost?.unitPricePerYear).toBe(22000);
    expect(serviceCloudCost?.annualCostPerType).toBe(660000);

    // 合計の検証
    expect(result.totalAnnualLicenseCost).toBe(2035000);

    // calculationDate が ISO 8601 形式であることを検証
    expect(result.calculationDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // targetFiscalYear の検証
    expect(result.targetFiscalYear).toBe('2024');
  });
});
