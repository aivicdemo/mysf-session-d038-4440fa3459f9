import { recordDiscrepancyConfirmationOperation } from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/platform/data-store.ts');

describe('SCEN-184: 営業部システム担当が有効な差異IDと確認ユーザーIDと有効な確認日時と許容値の判定結果を入力すると、差異確認履歴テーブルに記録され採番された確認IDを含むレコードが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('採番された確認IDを含むレコードが返される', async () => {
    const mockDataStore = require('../../src/platform/data-store.ts');

    mockDataStore.listRecords.mockResolvedValue([]);
    mockDataStore.createRecord.mockResolvedValue({
      confirmationId: '770e8400-e29b-41d4-a716-446655440002',
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      confirmationUserId: '660e8400-e29b-41d4-a716-446655440001',
      confirmationDateTime: '2025-02-15T14:30:45.123Z',
      confirmationContent: null,
      judgmentResult: '許容範囲内',
    });

    const result = await recordDiscrepancyConfirmationOperation({
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      confirmationUserId: '660e8400-e29b-41d4-a716-446655440001',
      confirmationDateTime: '2025-02-15T14:30:45.123Z',
      confirmationContent: null,
      judgmentResult: '許容範囲内',
    });

    expect(result.confirmationId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(result.discrepancyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.confirmationUserId).toBe('660e8400-e29b-41d4-a716-446655440001');
    expect(result.confirmationDateTime).toBe('2025-02-15T14:30:45.123Z');
    expect(result.confirmationContent).toBeNull();
    expect(result.judgmentResult).toBe('許容範囲内');
  });
});
