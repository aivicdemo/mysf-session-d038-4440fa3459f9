import { deleteRecord } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  deleteRecord: jest.fn(),
}));

describe('SCEN-960: deleteRecord - 請求明細レコード削除', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('存在する請求明細レコードを指定IDで削除すると、削除成功を示す出力が返される', async () => {
    const targetTableName = '請求明細';
    const targetRecordId = '550e8400-e29b-41d4-a716-446655440000';

    const mockRecord = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      請求明細ID: '550e8400-e29b-41d4-a716-446655440000',
      請求書ID: '660e8400-e29b-41d4-a716-446655440001',
      商談ID: '770e8400-e29b-41d4-a716-446655440002',
      営業活動ID: '880e8400-e29b-41d4-a716-446655440003',
      明細行番号: 1,
      商品名: 'コンサルティングサービス',
      商品説明: '営業プロセス改善コンサルティング',
      数量: 10,
      単価: 50000,
      金額: 500000,
      税率: 10,
      税額: 50000,
      税込金額: 550000,
      摘要: '2026年度上期分',
      createdAt: '2026-01-15T10:30:00Z',
      updatedAt: '2026-01-15T10:30:00Z',
      作成者: 'user-admin',
      修正前数量: null,
      修正前単価: null,
      修正前金額: null,
    };

    (dataStore.listRecords as jest.Mock).mockResolvedValue([mockRecord]);
    (dataStore.deleteRecord as jest.Mock).mockResolvedValue(undefined);

    const result = await deleteRecord({
      targetTableName,
      targetRecordId,
    });

    expect(result.targetTableName).toBe('請求明細');
    expect(result.targetRecordId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.success).toBe(true);
    expect(typeof result.deletedAt).toBe('string');

    // ISO 8601 形式の確認
    const deletedDate = new Date(result.deletedAt);
    expect(deletedDate.toString()).not.toBe('Invalid Date');

    // deleteRecord が呼ばれたことを確認
    expect(dataStore.deleteRecord).toHaveBeenCalledWith(targetTableName, targetRecordId);
  });
});
