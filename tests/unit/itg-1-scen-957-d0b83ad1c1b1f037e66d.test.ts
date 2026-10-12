import { deleteRecord } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-957: 商談レコード削除', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('存在する商談レコードを指定IDで削除すると、削除成功を示す出力が返される', async () => {
    const mockDealRecord = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      商談ID: '550e8400-e29b-41d4-a716-446655440000',
      取引先ID: '550e8400-e29b-41d4-a716-446655440001',
      営業担当者ID: '550e8400-e29b-41d4-a716-446655440002',
      商談名: 'A社システム導入プロジェクト',
      商談金額: 5000000,
      ステージ: '提案中',
      成約予定日: '2026-12-31T23:59:59Z',
      説明: 'A社への大型システム導入案件',
      成約日: null,
      失注理由: null,
      作成日時: '2026-01-15T10:30:00Z',
      更新日時: '2026-01-20T14:45:00Z',
      作成者ID: '550e8400-e29b-41d4-a716-446655440003',
      請求生成SLA期限: '2027-01-31T23:59:59Z',
      請求SLA超過フラグ: false,
      createdAt: '2026-01-15T10:30:00Z',
      updatedAt: '2026-01-20T14:45:00Z',
    };

    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce([mockDealRecord])
      .mockResolvedValueOnce([]);
    (dataStore.deleteRecord as jest.Mock).mockResolvedValue(undefined);

    const result = await deleteRecord({
      targetTableName: '商談',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(result.targetTableName).toBe('商談');
    expect(result.targetRecordId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.success).toBe(true);
    expect(result.deletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/);
    expect(dataStore.deleteRecord).toHaveBeenCalledWith('商談', '550e8400-e29b-41d4-a716-446655440000');
  });
});
