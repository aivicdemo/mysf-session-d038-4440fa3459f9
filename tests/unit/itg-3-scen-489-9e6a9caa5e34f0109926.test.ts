import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';

describe('SCEN-489: 修正内容の再検証結果を反映したダッシュボード表示が更新され、営業部システム担当に判定結果が通知される', () => {
  it('営業部システム担当ユーザーが許容範囲判定操作の実行権限を持つ場合、isAuthorized=true で返される', async () => {
    const input = {
      userId: 'user-sales-manager-001',
      userRole: 'sales_manager',
      userIsActive: true,
    };

    const result = await validateUserAuthorizationForToleranceJudgment(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-sales-manager-001');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
