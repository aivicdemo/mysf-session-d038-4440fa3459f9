import { recordDiscrepancyConfirmationOperation, InvalidDiscrepancyIdError } from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/platform/data-store.ts');

describe('SCEN-186: 差異IDが空文字列の場合、InvalidDiscrepancyIdErrorが発生し「差異IDは必須項目です。」文言が返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('空文字列の差異IDでエラーが発生する', async () => {
    const mockDataStore = require('../../src/platform/data-store.ts');
    mockDataStore.listRecords.mockResolvedValue([]);

    await expect(
      recordDiscrepancyConfirmationOperation({
        discrepancyId: '',
        confirmationUserId: 'user-uuid-12345',
        confirmationDateTime: '2026-10-07T10:30:00Z',
        confirmationContent: null,
        judgmentResult: '許容範囲内',
      })
    ).rejects.toThrow(InvalidDiscrepancyIdError);

    await expect(
      recordDiscrepancyConfirmationOperation({
        discrepancyId: '',
        confirmationUserId: 'user-uuid-12345',
        confirmationDateTime: '2026-10-07T10:30:00Z',
        confirmationContent: null,
        judgmentResult: '許容範囲内',
      })
    ).rejects.toThrow('差異IDは必須項目です。');
  });
});
