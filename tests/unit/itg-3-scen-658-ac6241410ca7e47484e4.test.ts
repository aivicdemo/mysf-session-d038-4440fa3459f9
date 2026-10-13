import { validateCSVExportInputs } from '../../src/logic/authorization-validation';

describe('SCEN-658: 選択された差異レコードの詳細情報が取得でき、旧新システム請求書データと是正追跡履歴が一括構築される', () => {
  it('should validate all fields and return isValid=true with ISO 8601 validatedAt', async () => {
    const selectedDiscrepancyIds = ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003'];
    const exportFormat = 'CSV';

    const result = await validateCSVExportInputs({
      selectedDiscrepancyIds,
      exportFormat,
    });

    expect(result.isValid).toBe(true);
    expect(result.validatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
