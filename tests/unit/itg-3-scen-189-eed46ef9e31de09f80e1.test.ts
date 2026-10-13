import { recordDiscrepancyConfirmationOperation, InvalidConfirmationUserIdError } from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/platform/data-store.ts');

describe('SCEN-189: 確認ユーザーIDがnullの場合、InvalidConfirmationUserIdErrorが発生し「確認ユーザーIDは必須項目です。」文言が返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('nullの確認ユーザーIDでエラーが発生する', async () => {
    const mockDataStore = require('../../src/platform/data-store.ts');
    mockDataStore.listRecords.mockResolvedValue([]);

    await expect(
      recordDiscrepancyConfirmationOperation({
        discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
        confirmationUserId: null as any,
        confirmationDateTime: '2025-01-15T10:30:00Z',
        confirmationContent: null,
        judgmentResult: '許容範囲内',
      })
    ).rejects.toThrow(InvalidConfirmationUserIdError);

    await expect(
      recordDiscrepancyConfirmationOperation({
        discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
        confirmationUserId: null as any,
        confirmationDateTime: '2025-01-15T10:30:00Z',
        confirmationContent: null,
        judgmentResult: '許容範囲内',
      })
    ).rejects.toThrow('確認ユーザーIDは必須項目です。');
  });
});
