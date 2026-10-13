import { validateUserAuthorizationForToleranceJudgment, InvalidUserIdError } from '../../src/logic/authorization-validation';

describe('SCEN-482: 必須フィールド（取引先、商談金額等）が空の場合、修正内容は却下される', () => {
  it('userId が空文字の場合、InvalidUserIdError が発生', async () => {
    const input = {
      userId: '',
      userRole: 'data_auditor',
      userIsActive: true,
    };

    await expect(validateUserAuthorizationForToleranceJudgment(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidUserIdError',
        message: expect.stringContaining('有効なユーザーIDが指定されていません。'),
      }),
    );
  });
});
