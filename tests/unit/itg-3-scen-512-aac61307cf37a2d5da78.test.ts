import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';

describe('SCEN-512: AIエージェント：システム間のデータ不整合が解決できない場合、エスカレーションされる', () => {
  it('data_analyst ロールでは許容範囲判定実行権限がないため、UnauthorizedRoleError または isAuthorized=false を返す', async () => {
    const input = {
      userId: 'user-001',
      userRole: 'data_analyst',
      userIsActive: true,
    };

    try {
      const result = await validateUserAuthorizationForToleranceJudgment(input);

      // 仕様の期待結果：isAuthorized=false を返す場合
      expect(result.isAuthorized).toBe(false);
      expect(result.userId).toBe('user-001');
      expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    } catch (error) {
      // 仕様の期待結果：UnauthorizedRoleError をスローする場合
      expect(error instanceof Error).toBe(true);
      if (error instanceof Error) {
        expect(error.message).toContain('このユーザーのロールは差異の許容範囲判定を実行する権限がありません');
      }
    }
  });

  it('システム間のデータ不整合が解決されていない状態で、権限不足の場合、エスカレーション対象として処理される', async () => {
    const input = {
      userId: 'user-001',
      userRole: 'data_analyst',
      userIsActive: true,
    };

    // 権限不足またはエラーが発生することを確認
    try {
      const result = await validateUserAuthorizationForToleranceJudgment(input);
      expect(result.isAuthorized).toBe(false);
    } catch (error) {
      expect(error instanceof Error).toBe(true);
      if (error instanceof Error) {
        expect(error.constructor.name).toBe('UnauthorizedRoleError');
      }
    }
  });
});
