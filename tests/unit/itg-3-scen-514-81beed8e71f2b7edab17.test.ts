import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';

describe('SCEN-514: AIエージェント：是正追跡ログが監査用ファイルとしてAmazon S3に保存される', () => {
  it('CORRECTION_REVIEWER ロールでアクティブユーザーの場合、isAuthorized=true で権限検証が成功する', async () => {
    const input = {
      userId: 'user-audit-001',
      userRole: 'CORRECTION_REVIEWER',
      userIsActive: true,
    };

    const result = await validateUserAuthorizationForToleranceJudgment(input);

    // 期待結果：isAuthorized=true、userId='user-audit-001'、authorizedAt は ISO 8601形式
    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-audit-001');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
  });

  it('権限検証が成功し、userRole CORRECTION_REVIEWER に実行権限があることが確認される', async () => {
    const input = {
      userId: 'user-audit-001',
      userRole: 'CORRECTION_REVIEWER',
      userIsActive: true,
    };

    const result = await validateUserAuthorizationForToleranceJudgment(input);

    // ユーザーアクティブ状態の確認
    expect(result.isAuthorized).toBe(true);

    // userId が有効な値であることを確認
    expect(result.userId).toBeTruthy();
    expect(result.userId).not.toBe('');
    expect(result.userId).not.toBeNull();

    // authorizedAt に ISO 8601形式の現在時刻が記録されていることを確認
    expect(result.authorizedAt).toBeTruthy();
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    expect(result.authorizedAt).toMatch(isoRegex);
  });
});
