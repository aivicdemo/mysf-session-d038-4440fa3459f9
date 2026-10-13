import { validateUserAuthorizationForToleranceJudgment, ValidateUserAuthorizationForToleranceJudgmentInput, ValidateUserAuthorizationForToleranceJudgmentOutput } from '../../src/logic/authorization-validation';

describe('SCEN-692: 判定された是正方法・実行者・実行予定日時が是正追跡管理テーブルに記録されるとき、履歴追跡が可能な状態で保存される', () => {
  it('ユーザーが tolerance_judge ロールで有効状態のとき、権限検証が成功し isAuthorized=true を返す', async () => {
    const input: ValidateUserAuthorizationForToleranceJudgmentInput = {
      userId: 'user-001',
      userRole: 'tolerance_judge',
      userIsActive: true,
    };

    const result: ValidateUserAuthorizationForToleranceJudgmentOutput = await validateUserAuthorizationForToleranceJudgment(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(typeof result.authorizedAt).toBe('string');
    // ISO 8601 形式の日時文字列か確認
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.authorizedAt)).toBe(true);
  });
});
