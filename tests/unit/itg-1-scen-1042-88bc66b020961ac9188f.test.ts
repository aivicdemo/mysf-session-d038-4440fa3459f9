import { notifyModificationRequest, TargetRecordNotFound } from '../../src/logic/notification-service';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchInvoiceById: jest.fn(),
}));

describe('SCEN-1042: notifyModificationRequest - 修正対象レコードが存在しないときエラー', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定された修正対象レコードIDが請求書・請求明細テーブルに存在しないとき、TargetRecordNotFound エラーを発生させる', async () => {
    const targetRecordId = '550e8400-e29b-41d4-a716-446655440000';
    const targetRecordType = 'invoice' as const;
    const modificationContent = '請求金額を1000000から950000に修正。消費税計算エラーが原因。';
    const modificationReason = '金額ズレ';
    const modificationDeadline = new Date('2026-12-31T23:59:59Z');
    const currentDateTime = new Date('2026-12-20T10:00:00Z');
    const requestedByUserId = 'user-admin-001';
    const requestedByUserName = '山田太郎';
    const notificationChannels = ['email' as const, 'in_app' as const];
    const urgencyLevel = 'high' as const;

    (dataPersistence.fetchInvoiceById as jest.Mock).mockResolvedValue(undefined);

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
    ).rejects.toThrow(TargetRecordNotFound);
  });
});
