import {
  validateUserAuthorizationForDiscrepancyConfirmation,
  InvalidUserIdFormatError,
  ValidateUserAuthorizationForDiscrepancyConfirmationInput,
} from '../../src/logic/authorization-validation';

describe('SCEN-469: AIエージェントの実行中に入力パラメータが不正な形式のとき', () => {
  it('エラーメッセージが記録され、人に報告される', async () => {
    const input: ValidateUserAuthorizationForDiscrepancyConfirmationInput = {
      userId: 'invalid-user-id-not-uuid',
      userRole: '経理部',
      userIsActive: true,
    };

    await expect(validateUserAuthorizationForDiscrepancyConfirmation(input)).rejects.toThrow(
      InvalidUserIdFormatError,
    );
    await expect(validateUserAuthorizationForDiscrepancyConfirmation(input)).rejects.toThrow(
      'ユーザーIDの形式が不正です。',
    );
  });
});
