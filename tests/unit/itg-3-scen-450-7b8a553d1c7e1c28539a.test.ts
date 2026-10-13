import {
  validateUserAuthorizationForDiscrepancyConfirmation,
  MissingRequiredInputError,
} from '../../src/logic/authorization-validation';

describe('SCEN-450: ステータスマッピングルールが定義されていないとき、ルール定義不足エラーが発生して処理が終了する', () => {
  it('ユーザーIDが空文字列のとき、MissingRequiredInputErrorが発生する', async () => {
    const input = {
      userId: '',
      userRole: '営業部システム担当',
      userIsActive: true,
    };

    await expect(
      validateUserAuthorizationForDiscrepancyConfirmation(input),
    ).rejects.toThrow(MissingRequiredInputError);

    await expect(
      validateUserAuthorizationForDiscrepancyConfirmation(input),
    ).rejects.toThrow('必須入力項目が不足しています。');
  });
});
