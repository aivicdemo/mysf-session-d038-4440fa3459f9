import { recordModificationWithHistory, IncompleteModificationDetails, RecordModificationWithHistoryInput } from '../../src/logic/modification-tracking';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-648: 修正理由が空の場合、IncompleteModificationDetails例外をスロー', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw IncompleteModificationDetails when modificationReason is empty', async () => {
    const mockInvoiceRecord = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      請求書ID: '550e8400-e29b-41d4-a716-446655440000',
      商談ID: '770e8400-e29b-41d4-a716-446655440002',
      取引先ID: '880e8400-e29b-41d4-a716-446655440003',
      営業担当者ID: '990e8400-e29b-41d4-a716-446655440004',
      請求書番号: 'INV-2026-001',
      請求日: new Date('2026-10-01T00:00:00.000Z'),
      支払期限日: new Date('2026-11-01T00:00:00.000Z'),
      請求金額: 100000,
      税額: 10000,
      税抜金額: 90000,
      請求ステータス: 'issued',
      入金日: null,
      入金金額: 0,
      摘要: 'サービス利用料',
      createdAt: new Date('2026-10-01T08:00:00.000Z'),
      updatedAt: new Date('2026-10-01T08:00:00.000Z'),
      作成者: 'admin',
      修正前請求金額: null,
      修正理由: null,
      再発行回数: 0,
      最終再発行日時: null,
      金額計算検証ステータス: 'valid',
      金額計算検証日時: new Date('2026-10-01T08:30:00.000Z'),
      参照関係検証ステータス: 'valid',
    };

    const mockModifierRecord = {
      id: '660e8400-e29b-41d4-a716-446655440001',
      ユーザーID: '660e8400-e29b-41d4-a716-446655440001',
      ログインID: 'user001',
      パスワードハッシュ: 'hashed_password_value',
      ユーザー名: '営業太郎',
      メールアドレス: 'taro@example.com',
      ロール: 'sales',
      営業担当者ID: '990e8400-e29b-41d4-a716-446655440004',
      有効フラグ: true,
      最終ログイン日時: new Date('2026-10-07T09:00:00.000Z'),
      createdAt: new Date('2026-09-01T00:00:00.000Z'),
      updatedAt: new Date('2026-10-07T09:00:00.000Z'),
      作成者: '550e8400-e29b-41d4-a716-446655440005',
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
          newValue: '120000',
        },
      ],
      modificationReason: '',
      modificationDateTime: new Date('2026-10-07T10:00:00.000Z'),
      currentDateTime: new Date('2026-10-07T11:00:00.000Z'),
      modifierUserId: '660e8400-e29b-41d4-a716-446655440001',
    };

    await expect(recordModificationWithHistory(input)).rejects.toThrow(
      IncompleteModificationDetails
    );

    const error = await recordModificationWithHistory(input).catch((e) => e);
    expect(error.message).toContain('修正理由');
  });
});
