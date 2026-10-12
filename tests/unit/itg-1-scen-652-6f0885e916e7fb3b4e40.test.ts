import { recordModificationWithHistory, IncompleteModificationDetails, RecordModificationWithHistoryInput } from '../../src/logic/modification-tracking';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-652: 修正理由が空である場合、IncompleteModificationDetails例外をスロー', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw IncompleteModificationDetails when modificationReason is empty string', async () => {
    const mockInvoiceRecord = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      請求書ID: '550e8400-e29b-41d4-a716-446655440000',
      商談ID: '770e8400-e29b-41d4-a716-446655440002',
      取引先ID: '880e8400-e29b-41d4-a716-446655440003',
      営業担当者ID: '990e8400-e29b-41d4-a716-446655440004',
      請求書番号: 'INV-20260115-001',
      請求日: new Date('2026-01-10T09:00:00Z'),
      支払期限日: new Date('2026-02-10T09:00:00Z'),
      請求金額: 100000,
      税額: 10000,
      税抜金額: 90000,
      請求ステータス: '未入金',
      入金日: null,
      入金金額: 0,
      摘要: '商品納入分',
      作成日時: new Date('2026-01-10T09:00:00Z'),
      更新日時: new Date('2026-01-10T09:00:00Z'),
      作成者: 'system',
      修正前請求金額: null,
      修正理由: null,
      再発行回数: 0,
      最終再発行日時: null,
      金額計算検証ステータス: '検証済み',
      金額計算検証日時: new Date('2026-01-10T09:15:00Z'),
      参照関係検証ステータス: '検証済み',
      createdAt: new Date('2026-01-10T09:00:00Z'),
      updatedAt: new Date('2026-01-10T09:00:00Z'),
    };

    const mockModifierRecord = {
      id: '660e8400-e29b-41d4-a716-446655440001',
      ユーザーID: '660e8400-e29b-41d4-a716-446655440001',
      ログインID: 'user.modifier',
      パスワードハッシュ: '$2b$10$abcdefghijklmnopqrstuvwxyz',
      ユーザー名: '修正者太郎',
      メールアドレス: 'modifier@example.com',
      ロール: '営業管理者',
      営業担当者ID: '990e8400-e29b-41d4-a716-446655440004',
      有効フラグ: true,
      最終ログイン日時: new Date('2026-01-15T09:00:00Z'),
      作成日時: new Date('2025-12-01T10:00:00Z'),
      更新日時: new Date('2026-01-15T09:00:00Z'),
      作成者: '660e8400-e29b-41d4-a716-446655440001',
      createdAt: new Date('2025-12-01T10:00:00Z'),
      updatedAt: new Date('2026-01-15T09:00:00Z'),
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
          newValue: '110000',
        },
      ],
      modificationReason: '',
      modificationDateTime: new Date('2026-01-15T10:30:00Z'),
      currentDateTime: new Date('2026-01-15T10:45:00Z'),
      modifierUserId: '660e8400-e29b-41d4-a716-446655440001',
    };

    await expect(recordModificationWithHistory(input)).rejects.toThrow(
      IncompleteModificationDetails
    );

    const error = await recordModificationWithHistory(input).catch((e) => e);
    expect(error.message).toContain('修正理由');
  });
});
