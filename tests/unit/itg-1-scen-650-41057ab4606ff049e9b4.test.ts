import { recordModificationWithHistory, RecordModificationWithHistoryInput, RecordModificationWithHistoryOutput } from '../../src/logic/modification-tracking';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-650: 修正前後の値が同じ場合、partial_failureステータスと警告メッセージを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return partial_failure status with warning message when previousValue equals newValue', async () => {
    const mockInvoiceRecord = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      請求書ID: '550e8400-e29b-41d4-a716-446655440000',
      商談ID: '770e8400-e29b-41d4-a716-446655440222',
      取引先ID: '880e8400-e29b-41d4-a716-446655440333',
      営業担当者ID: '990e8400-e29b-41d4-a716-446655440444',
      請求書番号: 'INV-2026-001',
      請求日: new Date('2026-09-01T00:00:00Z'),
      支払期限日: new Date('2026-10-01T00:00:00Z'),
      請求金額: 100000,
      税額: 10000,
      税抜金額: 90000,
      請求ステータス: '未入金',
      入金日: null,
      入金金額: 0,
      摘要: '商品販売',
      作成日時: new Date('2026-09-01T08:00:00Z'),
      更新日時: new Date('2026-10-05T15:30:00Z'),
      作成者: 'admin',
      修正前請求金額: null,
      修正理由: null,
      再発行回数: 0,
      最終再発行日時: null,
      金額計算検証ステータス: '検証済み',
      金額計算検証日時: new Date('2026-09-01T09:00:00Z'),
      参照関係検証ステータス: '検証済み',
      createdAt: new Date('2026-09-01T08:00:00Z'),
      updatedAt: new Date('2026-10-05T15:30:00Z'),
    };

    const mockModifierRecord = {
      id: '660e8400-e29b-41d4-a716-446655440111',
      ユーザーID: '660e8400-e29b-41d4-a716-446655440111',
      ログインID: 'user_sales_001',
      パスワードハッシュ: 'hashed_password_value',
      ユーザー名: '営業太郎',
      メールアドレス: 'sales_taro@company.com',
      ロール: 'sales',
      営業担当者ID: '990e8400-e29b-41d4-a716-446655440444',
      有効フラグ: true,
      最終ログイン日時: new Date('2026-10-07T09:00:00Z'),
      作成日時: new Date('2026-01-01T00:00:00Z'),
      更新日時: new Date('2026-10-07T09:00:00Z'),
      作成者: '660e8400-e29b-41d4-a716-446655440555',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-10-07T09:00:00Z'),
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
      id: '550e8400-e29b-41d4-a716-446655550000',
    }));

    (dataStore.listRecords as jest.Mock).mockImplementation(mockListRecords);
    (dataStore.createRecord as jest.Mock).mockImplementation(mockCreateRecord);

    const input: RecordModificationWithHistoryInput = {
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      modificationDetails: [
        {
          fieldName: '請求金額',
          previousValue: '100000',
          newValue: '100000',
        },
      ],
      modificationReason: '誤入力の修正',
      modificationDateTime: new Date('2026-10-07T10:00:00Z'),
      currentDateTime: new Date('2026-10-07T10:05:00Z'),
      modifierUserId: '660e8400-e29b-41d4-a716-446655440111',
    };

    const result: RecordModificationWithHistoryOutput = await recordModificationWithHistory(input);

    expect(result.status).toBe('partial_failure');
    expect(result.modificationRecordId).toBeDefined();
    expect(result.invoiceId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.modificationDateTime).toEqual(new Date('2026-10-07T10:00:00Z'));
    expect(result.modificationCount).toBeGreaterThan(0);
    expect(mockCreateRecord).toHaveBeenCalled();
  });
});
