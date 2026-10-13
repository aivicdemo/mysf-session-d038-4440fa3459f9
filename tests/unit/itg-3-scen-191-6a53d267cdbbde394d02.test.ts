import { recordDiscrepancyConfirmationOperation, InvalidJudgmentResultError } from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/platform/data-store.ts');

describe('SCEN-191: 判定結果が「許容範囲内」「許容範囲超過」「要確認」のいずれでもない場合、InvalidJudgmentResultErrorが発生し「判定結果は \"許容範囲内\", \"許容範囲超過\", \"要確認\" のいずれかである必要があります。」文言が返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('無効な判定結果でエラーが発生する', async () => {
    const mockDataStore = require('../../src/platform/data-store.ts');
    mockDataStore.listRecords.mockResolvedValue([]);

    await expect(
      recordDiscrepancyConfirmationOperation({
        discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
        confirmationUserId: '550e8400-e29b-41d4-a716-446655440001',
        confirmationDateTime: '2026-10-07T06:33:43.539Z',
        confirmationContent: null,
        judgmentResult: '無効な判定結果',
      })
    ).rejects.toThrow(InvalidJudgmentResultError);

    await expect(
      recordDiscrepancyConfirmationOperation({
        discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
        confirmationUserId: '550e8400-e29b-41d4-a716-446655440001',
        confirmationDateTime: '2026-10-07T06:33:43.539Z',
        confirmationContent: null,
        judgmentResult: '無効な判定結果',
      })
    ).rejects.toThrow('判定結果は "許容範囲内", "許容範囲超過", "要確認" のいずれかである必要があります。');
  });
});
