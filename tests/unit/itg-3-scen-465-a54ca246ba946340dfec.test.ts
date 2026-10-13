import { validateUserAuthorizationForDiscrepancyConfirmation } from '../../src/logic/authorization-validation';

describe('SCEN-465: AIエージェント実行時に自動通知の送信に失敗するとき、未送信アラートがダッシュボードに表示され、次回実行時に再送信が試みられる', () => {
  it('ユーザー認可検証関数が ISO 8601 形式の日時を返す', async () => {
    const input = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      userRole: '経理部',
      userIsActive: true,
    };

    const result = await validateUserAuthorizationForDiscrepancyConfirmation(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(result.authorizedAt)).toBe(true);
  });
});
