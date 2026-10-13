import { validateUserAuthorizationForToleranceJudgment, ValidateUserAuthorizationForToleranceJudgmentInput, ValidateUserAuthorizationForToleranceJudgmentOutput } from '../../src/logic/authorization-validation';

describe('SCEN-690: 指定された差異IDに対応する差異検出結果・旧新システム請求書データ・許容基準が存在するとき、差異詳細を集約して是正方法判定エンジンへ渡す', () => {
  it('ユーザーが TOLERANCE_JUDGE ロールで有効状態のとき、権限検証が成功し isAuthorized=true を返す', async () => {
    const input: ValidateUserAuthorizationForToleranceJudgmentInput = {
      userId: 'user-001',
      userRole: 'TOLERANCE_JUDGE',
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
