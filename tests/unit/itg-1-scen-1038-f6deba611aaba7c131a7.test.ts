import { notifyModificationRequest, InvalidModificationRequestInput } from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
}));

describe('SCEN-1038: notifyModificationRequest - targetRecordId が空のときエラー', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('修正対象レコードIDが空のとき、InvalidModificationRequestInput エラーを発生させる', async () => {
    const targetRecordId = '';
    const targetRecordType = 'invoice' as const;
    const modificationContent = '金額を100000円から120000円に修正。消費税を含めた合計額の再計算が必要です。';
    const modificationReason = '受注時の金額入力ミス。正しい契約金額は120000円です。';
    const modificationDeadline = new Date('2026-10-15T23:59:59Z');
    const currentDateTime = new Date('2026-10-10T10:00:00Z');
    const requestedByUserId = 'user-admin-001';
    const requestedByUserName = '営業部システム担当 太郎';
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
