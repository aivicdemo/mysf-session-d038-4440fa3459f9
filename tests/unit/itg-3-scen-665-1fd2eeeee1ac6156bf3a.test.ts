import { validateCSVExportInputs } from '../../src/logic/authorization-validation';

describe('SCEN-665: CSV出力操作の実行者・実行日時・出力対象件数・出力ファイル識別子が監査ログとして記録される', () => {
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
