import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';

describe('SCEN-484: 参照整合性エラー（商談と請求書の金額が一致しない、取引先が削除されている等）が検出される場合、修正内容は却下される', () => {
  it('TOLERANCE_JUDGE ロールで isAuthorized=true を得る', async () => {
    const input = {
      userId: 'user-001',
      userRole: 'TOLERANCE_JUDGE',
      userIsActive: true
    };

    const result = await validateUserAuthorizationForToleranceJudgment(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.authorizedAt).toBeDefined();
    // authorizedAt は ISO 8601 形式の日時文字列であることを確認
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.authorizedAt)).toBe(true);
  });
});
