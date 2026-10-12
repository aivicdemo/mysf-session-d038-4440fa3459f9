import { notifyModificationRequest, InvalidModificationRequestInput } from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
}));

describe('SCEN-1041: notifyModificationRequest - modificationDeadline が過去のときエラー', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('修正期限が現在日時より前であるとき、InvalidModificationRequestInput エラーを発生させる', async () => {
    const targetRecordId = '550e8400-e29b-41d4-a716-446655440000';
    const targetRecordType = 'invoice' as const;
    const modificationContent = '金額を100,000円から120,000円に修正';
    const modificationReason = '税額計算の誤り';
    const modificationDeadline = new Date('2026-01-01T10:00:00Z');
    const currentDateTime = new Date('2026-01-05T14:30:00Z');
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
