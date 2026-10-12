import { notifyModificationRequest, InvalidModificationRequestInput } from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
}));

describe('SCEN-1039: notifyModificationRequest - modificationContent が空のときエラー', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('修正内容が空のとき、InvalidModificationRequestInput エラーを発生させる', async () => {
    const targetRecordId = '550e8400-e29b-41d4-a716-446655440000';
    const targetRecordType = 'invoice' as const;
    const modificationContent = '';
    const modificationReason = '金額ズレの修正';
    const modificationDeadline = new Date('2026-12-31T23:59:59Z');
    const currentDateTime = new Date('2026-12-15T10:00:00Z');
    const requestedByUserId = 'user-sys-001';
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
