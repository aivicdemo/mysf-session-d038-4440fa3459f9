import { recordModificationWithHistory } from '../../src/logic/modification-tracking';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  createRecord: jest.fn(),
}));

describe('SCEN-647: 修正内容配列が空の場合、修正履歴レコードを作成して成功を返す', () => {
  it('空の修正内容配列でも修正履歴が記録され、成功ステータスが返される', async () => {
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
            請求日: '2026-10-01T09:00:00Z',
            支払期限日: '2026-11-01T23:59:59Z',
            請求金額: 1000000,
            税額: 100000,
            税抜金額: 900000,
            請求ステータス: '未入金',
            入金日: null,
            入金金額: 0,
            摘要: '商品A納品分',
            作成日時: '2026-10-01T08:00:00Z',
            更新日時: '2026-10-01T08:00:00Z',
            作成者: 'admin',
            修正前請求金額: null,
            修正理由: null,
            再発行回数: 0,
            最終再発行日時: null,
            金額計算検証ステータス: '完了',
            金額計算検証日時: '2026-10-01T08:30:00Z',
            参照関係検証ステータス: '完了',
            createdAt: '2026-10-01T08:00:00Z',
            updatedAt: '2026-10-01T08:00:00Z',
          },
        ]);
      } else if (tableName === 'ユーザー') {
        return Promise.resolve([
          {
            id: '660e8400-e29b-41d4-a716-446655440001',
            ユーザーID: '660e8400-e29b-41d4-a716-446655440001',
            ログインID: 'modifier_user',
            パスワードハッシュ: 'hashed_password_value',
            ユーザー名: '修正権限ユーザー',
            メールアドレス: 'modifier@example.com',
            ロール: 'accounting_staff',
            営業担当者ID: null,
            有効フラグ: true,
            最終ログイン日時: '2026-10-15T09:00:00Z',
            作成日時: '2026-09-01T10:00:00Z',
            更新日時: '2026-10-15T09:00:00Z',
            作成者: '660e8400-e29b-41d4-a716-446655440005',
            createdAt: '2026-09-01T10:00:00Z',
            updatedAt: '2026-10-15T09:00:00Z',
          },
        ]);
      } else if (tableName === '請求書修正内容') {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    mockCreateRecord.mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440020',
      modificationRecordId: '550e8400-e29b-41d4-a716-446655440020',
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      modificationDateTime: '2026-10-15T10:30:00Z',
      modificationReason: '営業担当者からの修正依頼に基づき、請求金額の計算誤りを是正',
      modifierUserId: '660e8400-e29b-41d4-a716-446655440001',
      createdAt: '2026-10-15T11:00:00Z',
    });

    const input = {
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      modificationDetails: [],
      modificationReason: '営業担当者からの修正依頼に基づき、請求金額の計算誤りを是正',
      modificationDateTime: new Date('2026-10-15T10:30:00Z'),
      currentDateTime: new Date('2026-10-15T11:00:00Z'),
      modifierUserId: '660e8400-e29b-41d4-a716-446655440001',
    };

    const result = await recordModificationWithHistory(input);

    expect(result.status).toBe('success');
    expect(result.modificationCount).toBe(1);
    expect(result.invoiceId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.modificationDateTime).toEqual(new Date('2026-10-15T10:30:00Z'));
    expect(result.modificationRecordId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });
});
