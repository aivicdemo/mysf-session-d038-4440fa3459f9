import { recordModificationWithHistory, IncompleteModificationDetails, RecordModificationWithHistoryInput } from '../../src/logic/modification-tracking';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-649: 修正後の値が空の場合、IncompleteModificationDetails例外をスロー', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw IncompleteModificationDetails when newValue is empty', async () => {
    const mockInvoiceRecord = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      請求書ID: '550e8400-e29b-41d4-a716-446655440000',
      商談ID: '660e8400-e29b-41d4-a716-446655440001',
      取引先ID: '770e8400-e29b-41d4-a716-446655440002',
      営業担当者ID: '880e8400-e29b-41d4-a716-446655440003',
      請求書番号: 'INV-2024-001',
      請求日: new Date('2024-01-15T09:00:00Z'),
      支払期限日: new Date('2024-02-15T23:59:59Z'),
      請求金額: 100000,
      税額: 10000,
      税抜金額: 90000,
      請求ステータス: 'issued',
      入金日: null,
      入金金額: 0,
      摘要: '2024年1月納品分',
      作成日時: new Date('2024-01-10T08:00:00Z'),
      更新日時: new Date('2024-01-15T09:00:00Z'),
      作成者: 'system',
      修正前請求金額: null,
      修正理由: null,
      再発行回数: 0,
      最終再発行日時: null,
      金額計算検証ステータス: 'valid',
      金額計算検証日時: new Date('2024-01-15T09:00:00Z'),
      参照関係検証ステータス: 'valid',
      createdAt: new Date('2024-01-10T08:00:00Z'),
      updatedAt: new Date('2024-01-15T09:00:00Z'),
    };

    const mockModifierRecord = {
      id: '990e8400-e29b-41d4-a716-446655440004',
      ユーザーID: '990e8400-e29b-41d4-a716-446655440004',
      ログインID: 'user_modifier_001',
      パスワードハッシュ: '$2b$10$abcdefghijklmnopqrstuvwxyz',
      ユーザー名: '修正者太郎',
      メールアドレス: 'modifier@company.com',
      ロール: 'sales_admin',
      営業担当者ID: '880e8400-e29b-41d4-a716-446655440003',
      有効フラグ: true,
      最終ログイン日時: new Date('2024-01-20T10:30:00Z'),
      作成日時: new Date('2023-06-01T00:00:00Z'),
      更新日時: new Date('2024-01-20T10:30:00Z'),
      作成者: '550e8400-e29b-41d4-a716-446655440005',
      createdAt: new Date('2023-06-01T00:00:00Z'),
      updatedAt: new Date('2024-01-20T10:30:00Z'),
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

    (dataStore.listRecords as jest.Mock).mockImplementation(mockListRecords);

    const input: RecordModificationWithHistoryInput = {
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      modificationDetails: [
        {
          fieldName: '請求金額',
          previousValue: '100000',
          newValue: '',
        },
      ],
      modificationReason: '営業部システム担当からの修正依頼に基づき、請求金額を訂正',
      modificationDateTime: new Date('2024-01-20T14:00:00Z'),
      currentDateTime: new Date('2024-01-20T15:00:00Z'),
      modifierUserId: '990e8400-e29b-41d4-a716-446655440004',
    };

    await expect(recordModificationWithHistory(input)).rejects.toThrow(
      IncompleteModificationDetails
    );

    const error = await recordModificationWithHistory(input).catch((e) => e);
    expect(error.message).toContain('修正理由');
  });
});
