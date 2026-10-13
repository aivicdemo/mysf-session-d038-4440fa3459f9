import {
  validateUserAuthorizationForDiscrepancyConfirmation,
  ValidateUserAuthorizationForDiscrepancyConfirmationInput,
  ValidateUserAuthorizationForDiscrepancyConfirmationOutput,
} from '../../src/logic/authorization-validation';

describe('SCEN-467: AIエージェント実行により自動通知と修正内容の変更履歴が監査用ファイルとして保存される', () => {
  it('権限判定結果と検証実行日時を含む出力型を生成する', async () => {
    const input: ValidateUserAuthorizationForDiscrepancyConfirmationInput = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      userRole: '経理部',
      userIsActive: true,
    };

    const result: ValidateUserAuthorizationForDiscrepancyConfirmationOutput =
      await validateUserAuthorizationForDiscrepancyConfirmation(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
