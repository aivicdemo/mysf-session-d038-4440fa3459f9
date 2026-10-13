import { recordDiscrepancyConfirmationOperation, InvalidDiscrepancyIdError } from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/platform/data-store.ts');

describe('SCEN-187: 差異IDがnullの場合、InvalidDiscrepancyIdErrorが発生し「差異IDは必須項目です。」文言が返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('nullの差異IDでエラーが発生する', async () => {
    const mockDataStore = require('../../src/platform/data-store.ts');
    mockDataStore.listRecords.mockResolvedValue([]);

    await expect(
      recordDiscrepancyConfirmationOperation({
        discrepancyId: null as any,
        confirmationUserId: 'user-123e4567-e89b-12d3-a456-426614174000',
        confirmationDateTime: '2026-01-15T10:30:00Z',
        confirmationContent: null,
        judgmentResult: '許容範囲内',
      })
    ).rejects.toThrow(InvalidDiscrepancyIdError);

    await expect(
      recordDiscrepancyConfirmationOperation({
        discrepancyId: null as any,
        confirmationUserId: 'user-123e4567-e89b-12d3-a456-426614174000',
        confirmationDateTime: '2026-01-15T10:30:00Z',
        confirmationContent: null,
        judgmentResult: '許容範囲内',
      })
    ).rejects.toThrow('差異IDは必須項目です。');
  });
});
