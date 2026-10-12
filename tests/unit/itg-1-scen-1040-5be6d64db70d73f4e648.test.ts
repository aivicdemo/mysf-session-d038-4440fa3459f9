import { notifyModificationRequest, InvalidModificationRequestInput } from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
}));

describe('SCEN-1040: notifyModificationRequest - modificationReason が空のときエラー', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('修正理由が空のとき、InvalidModificationRequestInput エラーを発生させる', async () => {
    const targetRecordId = '550e8400-e29b-41d4-a716-446655440000';
    const targetRecordType = 'invoice' as const;
    const modificationContent = '金額を100,000円から150,000円に修正。税抜金額フィールド変更。';
    const modificationReason = '';
    const modificationDeadline = new Date('2026-10-15T17:00:00Z');
    const currentDateTime = new Date('2026-10-08T09:00:00Z');
    const requestedByUserId = 'user-admin-001';
    const requestedByUserName = '山田太郎';
    const notificationChannels = ['email' as const, 'in_app' as const];
    const urgencyLevel = 'high' as const;

    await expect(
      notifyModificationRequest({
        targetRecordId,
        targetRecordType,
        modificationContent,
        modificationReason,
        modificationDeadline,
        currentDateTime,
        requestedByUserId,
        requestedByUserName,
        notificationChannels,
        urgencyLevel,
      })
    ).rejects.toThrow(InvalidModificationRequestInput);
  });
});
