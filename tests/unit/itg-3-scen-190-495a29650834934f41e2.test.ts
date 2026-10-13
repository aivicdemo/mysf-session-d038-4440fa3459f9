import { recordDiscrepancyConfirmationOperation, InvalidConfirmationDateTimeError } from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/platform/data-store.ts');

describe('SCEN-190: 確認日時がISO 8601形式ではない場合、InvalidConfirmationDateTimeErrorが発生し「確認日時は有効なタイムスタンプ形式である必要があります。」文言が返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('ISO 8601形式でない確認日時でエラーが発生する', async () => {
    const mockDataStore = require('../../src/platform/data-store.ts');
    mockDataStore.listRecords.mockResolvedValue([]);

    await expect(
      recordDiscrepancyConfirmationOperation({
        discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
        confirmationUserId: '660e8400-e29b-41d4-a716-446655440001',
        confirmationDateTime: '2024-01-15T14:30:00',
        confirmationContent: '営業部システムの売上データと本社システムの請求データの金額差異を確認。系統的な差異ではなく個別案件の入力遅延が原因と判定。',
        judgmentResult: '許容範囲内',
      })
    ).rejects.toThrow(InvalidConfirmationDateTimeError);

    await expect(
      recordDiscrepancyConfirmationOperation({
        discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
        confirmationUserId: '660e8400-e29b-41d4-a716-446655440001',
        confirmationDateTime: '2024-01-15T14:30:00',
        confirmationContent: '営業部システムの売上データと本社システムの請求データの金額差異を確認。系統的な差異ではなく個別案件の入力遅延が原因と判定。',
        judgmentResult: '許容範囲内',
      })
    ).rejects.toThrow('確認日時は有効なタイムスタンプ形式である必要があります。');
  });
});
