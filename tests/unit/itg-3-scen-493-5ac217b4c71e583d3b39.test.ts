import { validateUserAuthorizationForToleranceJudgment, InvalidUserIdError } from '../../src/logic/authorization-validation';

describe('SCEN-493: 是正前後のデータスナップショットが存在しない場合、データ整合性検証を実行できない', () => {
  it('ユーザーID が空文字の場合、InvalidUserIdError が発生する', async () => {
    const input = {
      userId: '',
      userRole: 'data_reviewer',
      userIsActive: true,
    };

    await expect(validateUserAuthorizationForToleranceJudgment(input)).rejects.toThrow(InvalidUserIdError);
  });
});
