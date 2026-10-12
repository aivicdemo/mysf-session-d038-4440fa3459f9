import { recordModificationWithHistory, RecordModificationWithHistoryInput, RecordModificationWithHistoryOutput } from '../../src/logic/modification-tracking';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-651: すべての修正内容が入力された場合、修正履歴レコードIDと修正ステータスを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return success status with modification record ID when all required fields are provided', async () => {
    const mockInvoiceRecord = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      請求書ID: '550e8400-e29b-41d4-a716-446655440000',
      商談ID: '770e8400-e29b-41d4-a716-446655440222',
      取引先ID: '880e8400-e29b-41d4-a716-446655440333',
      営業担当者ID: '990e8400-e29b-41d4-a716-446655440444',
      請求書番号: 'INV-2026-001',
      請求日: new Date('2026-10-01T00:00:00Z'),
      支払期限日: new Date('2026-11-01T00:00:00Z'),
      請求金額: 100000,
      税額: 10000,
      税抜金額: 90000,
      請求ステータス: '未送付',
      入金日: null,
      入金金額: null,
      摘要: 'サンプル請求書',
      作成日時: new Date('2026-10-01T09:00:00Z'),
      更新日時: new Date('2026-10-01T09:00:00Z'),
      作成者: 'system',
      修正前請求金額: null,
      修正理由: null,
      再発行回数: 0,
      最終再発行日時: null,
      金額計算検証ステータス: '未検証',
      金額計算検証日時: null,
      参照関係検証ステータス: '未検証',
      createdAt: new Date('2026-10-01T09:00:00Z'),
      updatedAt: new Date('2026-10-01T09:00:00Z'),
    };

    const mockModifierRecord = {
      id: '660e8400-e29b-41d4-a716-446655440111',
      ユーザーID: '660e8400-e29b-41d4-a716-446655440111',
      ログインID: 'sales_user_001',
      パスワードハッシュ: '$2b$10$examplehash',
      ユーザー名: '営業担当太郎',
      メールアドレス: 'taro@company.example.com',
      ロール: '営業',
      営業担当者ID: '990e8400-e29b-41d4-a716-446655440444',
      有効フラグ: true,
      最終ログイン日時: new Date('2026-10-07T09:00:00Z'),
      作成日時: new Date('2026-09-01T00:00:00Z'),
      更新日時: new Date('2026-10-05T00:00:00Z'),
      作成者: '660e8400-e29b-41d4-a716-446655440555',
      createdAt: new Date('2026-09-01T00:00:00Z'),
      updatedAt: new Date('2026-10-05T00:00:00Z'),
    };

    const mockListRecords = jest.fn((tableName) => {
      if (tableName === '請求書') {
        return Promise.resolve([mockInvoiceRecord]);
      }
      if (tableName === 'ユーザー') {
        return Promise.resolve([mockModifierRecord]);
      }
      return Promise.resolve([]);
    });

    const mockCreateRecord = jest.fn(() => Promise.resolve({
      id: 'abc12345-def6-7890-ghij-klmnopqrstuv',
    }));

    (dataStore.listRecords as jest.Mock).mockImplementation(mockListRecords);
    (dataStore.createRecord as jest.Mock).mockImplementation(mockCreateRecord);

    const input: RecordModificationWithHistoryInput = {
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      modificationDetails: [
        {
          fieldName: '請求金額',
          previousValue: '100000',
          newValue: '105000',
        },
        {
          fieldName: '請求ステータス',
          previousValue: '未送付',
          newValue: '送付済み',
        },
      ],
      modificationReason: '営業担当者の入力ミスを修正',
      modificationDateTime: new Date('2026-10-07T10:30:00Z'),
      currentDateTime: new Date('2026-10-07T10:45:00Z'),
      modifierUserId: '660e8400-e29b-41d4-a716-446655440111',
    };

    const result: RecordModificationWithHistoryOutput = await recordModificationWithHistory(input);

    expect(result.status).toBe('success');
    expect(result.modificationRecordId).toBe('abc12345-def6-7890-ghij-klmnopqrstuv');
    expect(result.invoiceId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.modificationDateTime).toEqual(new Date('2026-10-07T10:30:00Z'));
    expect(result.modificationCount).toBeGreaterThan(0);
    expect(mockCreateRecord).toHaveBeenCalledWith(
      '請求書修正内容',
      expect.objectContaining({
        請求書ID: '550e8400-e29b-41d4-a716-446655440000',
        修正理由: '営業担当者の入力ミスを修正',
        修正者ユーザーID: '660e8400-e29b-41d4-a716-446655440111',
      })
    );
  });
});
