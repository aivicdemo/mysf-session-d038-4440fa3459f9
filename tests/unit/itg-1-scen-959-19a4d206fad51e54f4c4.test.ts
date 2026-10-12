import { deleteRecord } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  deleteRecord: jest.fn(),
}));

describe('SCEN-959: deleteRecord - 請求書レコード削除', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('存在する請求書レコードを指定IDで削除すると、削除成功を示す出力が返される', async () => {
    const targetTableName = '請求書';
    const targetRecordId = '550e8400-e29b-41d4-a716-446655440000';

    const mockRecord = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      請求書番号: 'INV-2025-001',
      商談ID: '660e8400-e29b-41d4-a716-446655440001',
      取引先ID: '770e8400-e29b-41d4-a716-446655440002',
      営業担当者ID: '880e8400-e29b-41d4-a716-446655440003',
      請求日: '2025-01-15T00:00:00Z',
      支払期限日: '2025-02-15T00:00:00Z',
      請求金額: 1000000,
      税額: 100000,
      税抜金額: 900000,
      請求ステータス: '未入金',
      入金日: null,
      入金金額: 0,
      摘要: '月次請求',
      createdAt: '2025-01-15T10:30:00Z',
      updatedAt: '2025-01-15T10:30:00Z',
      作成者: 'admin',
      修正前請求金額: null,
      修正理由: null,
      再発行回数: 0,
      最終再発行日時: null,
      金額計算検証ステータス: '合格',
      金額計算検証日時: '2025-01-15T10:31:00Z',
      参照関係検証ステータス: '合格',
    };

    (dataStore.listRecords as jest.Mock).mockResolvedValue([mockRecord]);
    (dataStore.deleteRecord as jest.Mock).mockResolvedValue(undefined);

    const result = await deleteRecord({
      targetTableName,
      targetRecordId,
    });

    expect(result.targetTableName).toBe('請求書');
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
