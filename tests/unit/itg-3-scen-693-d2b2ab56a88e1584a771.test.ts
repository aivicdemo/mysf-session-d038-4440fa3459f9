import { validateUserAuthorizationForToleranceJudgment, ValidateUserAuthorizationForToleranceJudgmentInput, ValidateUserAuthorizationForToleranceJudgmentOutput } from '../../src/logic/authorization-validation';

describe('SCEN-693: 判定された是正方法と差異の重大度に基づいて段階的報告（営業部システム担当→経理部門→IT部門）がSLA内に実行されるとき、各段階の指示連携が完了する', () => {
  it('ユーザーが sales_manager ロールで有効状態のとき、権限検証が成功し isAuthorized=true を返す', async () => {
    const input: ValidateUserAuthorizationForToleranceJudgmentInput = {
      userId: 'user-営業-001',
      userRole: 'sales_manager',
      userIsActive: true,
    };

    const result: ValidateUserAuthorizationForToleranceJudgmentOutput = await validateUserAuthorizationForToleranceJudgment(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-営業-001');
    expect(typeof result.authorizedAt).toBe('string');
    // ISO 8601 形式の日時文字列か確認
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.authorizedAt)).toBe(true);
  });
});
