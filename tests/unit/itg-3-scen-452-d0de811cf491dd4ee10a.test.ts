import {
  validateUserAuthorizationForDiscrepancyConfirmation,
  MissingRequiredInputError,
} from '../../src/logic/authorization-validation';

describe('SCEN-452: 取引先IDリストが空のとき、取引先データ不在エラーが発生して処理が終了する', () => {
  it('ユーザーIDが空文字列のとき、MissingRequiredInputErrorが発生する', async () => {
    const input = {
      userId: '',
      userRole: '経理部',
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
