import { validateUserAuthorizationForToleranceJudgment, ValidateUserAuthorizationForToleranceJudgmentInput, ValidateUserAuthorizationForToleranceJudgmentOutput } from '../../src/logic/authorization-validation';

describe('SCEN-691: 差異の種類・金額規模・発生件数・影響範囲に基づいて是正方法（手動修正・自動同期・ロールバック）が判定されるとき、判定結果が是正追跡管理へ渡される', () => {
  it('ユーザーが reconciliation_auditor ロールで有効状態のとき、権限検証が成功し isAuthorized=true を返す', async () => {
    const input: ValidateUserAuthorizationForToleranceJudgmentInput = {
      userId: 'user-001',
      userRole: 'reconciliation_auditor',
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
