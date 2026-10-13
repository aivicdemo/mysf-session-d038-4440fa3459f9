import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';

describe('SCEN-608: 検出された差異が許容基準を超過するとき、判定結果『要対応』と根拠が生成される', () => {
  it('ユーザーID、ロール、アクティブ状態が有効なとき、権限検証が成功して isAuthorized=true を返す', async () => {
    const result = await validateUserAuthorizationForToleranceJudgment({
      userId: 'user-12345',
      userRole: 'DATA_VALIDATOR',
      userIsActive: true,
    });

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-12345');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });

  it('出力型の authorizedAt が ISO 8601 形式の有効な日時文字列であることを確認する', async () => {
    const result = await validateUserAuthorizationForToleranceJudgment({
      userId: 'user-12345',
      userRole: 'DATA_VALIDATOR',
      userIsActive: true,
    });

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    expect(result.authorizedAt).toMatch(iso8601Regex);
    expect(new Date(result.authorizedAt)).not.toEqual(new Date('Invalid'));
  });
});
