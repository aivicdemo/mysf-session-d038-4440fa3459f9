import { validateUserAuthorizationForDiscrepancyConfirmation, MissingRequiredInputError } from '../../src/logic/authorization-validation';

describe('SCEN-322: 必須入力項目のいずれかが不足しているとき', () => {
  it('MissingRequiredInputError が発生する', async () => {
    await expect(
      validateUserAuthorizationForDiscrepancyConfirmation({
        userId: null as unknown as string,
        userRole: '営業部システム担当',
        userIsActive: true,
      }),
    ).rejects.toThrow(MissingRequiredInputError);

    await expect(
      validateUserAuthorizationForDiscrepancyConfirmation({
        userId: null as unknown as string,
        userRole: '営業部システム担当',
        userIsActive: true,
      }),
    ).rejects.toThrow('必須入力項目が不足しています。');
  });
});
