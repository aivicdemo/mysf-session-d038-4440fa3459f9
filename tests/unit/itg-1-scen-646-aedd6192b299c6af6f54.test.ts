import { recordModificationWithHistory } from '../../src/logic/modification-tracking';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  createRecord: jest.fn(),
}));

describe('SCEN-646: 同一請求書に対して複数回の修正が記録される場合、修正回数が累積される', () => {
  it('既存修正履歴1件に新規修正1件が追加され、修正回数2が返される', async () => {
    const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;
    const mockCreateRecord = dataStore.createRecord as jest.MockedFunction<typeof dataStore.createRecord>;

    mockListRecords.mockImplementation((tableName: string) => {
      if (tableName === '請求書') {
        return Promise.resolve([
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            請求書ID: '550e8400-e29b-41d4-a716-446655440000',
            商談ID: '770e8400-e29b-41d4-a716-446655440002',
            取引先ID: '880e8400-e29b-41d4-a716-446655440003',
            営業担当者ID: '990e8400-e29b-41d4-a716-446655440004',
            請求書番号: 'INV-2026-001',
            請求日: '2026-10-01T00:00:00Z',
            支払期限日: '2026-11-01T00:00:00Z',
            請求金額: '100000',
            税額: '10000',
            税抜金額: '90000',
            請求ステータス: '未入金',
            入金日: null,
            入金金額: null,
            摘要: '初回請求',
            作成日時: '2026-10-01T08:00:00Z',
            更新日時: '2026-10-01T08:00:00Z',
            作成者: 'admin',
            修正前請求金額: null,
            修正理由: null,
            再発行回数: 0,
            最終再発行日時: null,
            金額計算検証ステータス: '済',
            金額計算検証日時: '2026-10-01T09:00:00Z',
            参照関係検証ステータス: '済',
            createdAt: '2026-10-01T08:00:00Z',
            updatedAt: '2026-10-01T08:00:00Z',
          },
        ]);
      } else if (tableName === 'ユーザー') {
        return Promise.resolve([
          {
            id: '660e8400-e29b-41d4-a716-446655440001',
            ユーザーID: '660e8400-e29b-41d4-a716-446655440001',
            ログインID: 'user001',
            パスワードハッシュ: '$2b$10$examplehash',
            ユーザー名: '山田太郎',
            メールアドレス: 'yamada@example.com',
            ロール: '営業',
            営業担当者ID: '990e8400-e29b-41d4-a716-446655440004',
            有効フラグ: true,
            最終ログイン日時: '2026-10-07T09:00:00Z',
            作成日時: '2026-01-01T00:00:00Z',
            更新日時: '2026-10-07T09:00:00Z',
            作成者: '550e8400-e29b-41d4-a716-446655440005',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-10-07T09:00:00Z',
          },
        ]);
      } else if (tableName === '請求書修正内容') {
        return Promise.resolve([
          {
            id: '550e8400-e29b-41d4-a716-446655440011',
            modificationRecordId: '550e8400-e29b-41d4-a716-446655440011',
            invoiceId: '550e8400-e29b-41d4-a716-446655440000',
            modificationDateTime: '2026-10-05T09:00:00Z',
            fieldName: '請求金額',
            previousValue: '95000',
            newValue: '100000',
            modificationReason: '消費税計算誤り修正',
            modifierUserId: '660e8400-e29b-41d4-a716-446655440001',
            createdAt: '2026-10-05T10:00:00Z',
          },
        ]);
      }
      return Promise.resolve([]);
    });

    mockCreateRecord.mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440013',
      modificationRecordId: '550e8400-e29b-41d4-a716-446655440013',
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      modificationDateTime: '2026-10-07T10:00:00Z',
      fieldName: '請求金額',
      previousValue: '100000',
      newValue: '105000',
      modificationReason: '消費税計算誤り修正',
      modifierUserId: '660e8400-e29b-41d4-a716-446655440001',
      createdAt: '2026-10-07T10:30:00Z',
    });

    const input = {
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      modificationDetails: [
        {
          fieldName: '請求金額',
          previousValue: '100000',
          newValue: '105000',
        },
      ],
      modificationReason: '消費税計算誤り修正',
      modificationDateTime: new Date('2026-10-07T10:00:00Z'),
      currentDateTime: new Date('2026-10-07T10:30:00Z'),
      modifierUserId: '660e8400-e29b-41d4-a716-446655440001',
    };

    const result = await recordModificationWithHistory(input);

    expect(result.status).toBe('success');
    expect(result.modificationCount).toBe(2);
    expect(result.invoiceId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.modificationDateTime).toEqual(new Date('2026-10-07T10:00:00Z'));
    expect(result.modificationRecordId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });
});
