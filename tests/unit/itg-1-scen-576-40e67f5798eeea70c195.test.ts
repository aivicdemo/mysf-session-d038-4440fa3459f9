import { calculateAnnualLicenseCost, LicenseManagementSheetNotProvided } from '../../src/logic/license-cost-calculation';

describe('SCEN-576: ライセンス管理表が空のとき、LicenseManagementSheetNotProvided エラーが発生する', () => {
  it('should throw LicenseManagementSheetNotProvided error when licenseManagementSheet is null', async () => {
    const input = {
      contractDocument: null,
      licenseManagementSheet: null,
      targetFiscalYear: '2024',
    };

    await expect(calculateAnnualLicenseCost(input)).rejects.toThrow(
      LicenseManagementSheetNotProvided
    );
    await expect(calculateAnnualLicenseCost(input)).rejects.toThrow(
      'ライセンス管理表が提供されていません。営業部システム担当にライセンス管理表の提供を依頼してください。'
    );
  });
});
