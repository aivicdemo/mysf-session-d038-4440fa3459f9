import { recordDiscrepancyConfirmationOperation } from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/platform/data-store.ts');

describe('SCEN-185: 確認内容がnullの場合、確認内容なしでテーブルに記録され、出力のconfirmationContentもnullで返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('確認内容がnullで記録される', async () => {
    const mockDataStore = require('../../src/platform/data-store.ts');

    mockDataStore.listRecords.mockResolvedValue([]);
    mockDataStore.createRecord.mockResolvedValue({
      confirmationId: 'uuid-new-confirmation-001',
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      confirmationUserId: '660e8400-e29b-41d4-a716-446655440001',
      confirmationDateTime: '2026-01-15T14:30:00Z',
      confirmationContent: null,
      judgmentResult: '許容範囲内',
    });

    const result = await recordDiscrepancyConfirmationOperation({
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      confirmationUserId: '660e8400-e29b-41d4-a716-446655440001',
      confirmationDateTime: '2026-01-15T14:30:00Z',
      confirmationContent: null,
      judgmentResult: '許容範囲内',
    });

    expect(result.confirmationId).toBe('uuid-new-confirmation-001');
    expect(result.discrepancyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.confirmationUserId).toBe('660e8400-e29b-41d4-a716-446655440001');
    expect(result.confirmationDateTime).toBe('2026-01-15T14:30:00Z');
    expect(result.confirmationContent).toBeNull();
    expect(result.judgmentResult).toBe('許容範囲内');
  });
});
