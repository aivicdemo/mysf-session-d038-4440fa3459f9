import { recordModificationWithHistory } from '../../src/logic/modification-tracking';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  createRecord: jest.fn(),
}));

describe('SCEN-645: 複数の修正内容が入力され、その一部の保存に失敗した場合、partial_failureステータスで成功した修正の件数を返す', () => {
  it('成功した修正件数がmodificationCountに返される', async () => {
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
            請求書番号: 'INV-2025-00001',
            請求日: '2025-06-01T00:00:00Z',
            支払期限日: '2025-07-01T00:00:00Z',
            請求金額: '100000',
            税額: '10000',
            税抜金額: '90000',
            請求ステータス: '未請求',
            入金日: null,
            入金金額: null,
            摘要: '商品Aの請求',
            作成日時: '2025-06-01T09:00:00Z',
            更新日時: '2025-06-01T09:00:00Z',
            作成者: 'admin',
            修正前請求金額: null,
            修正理由: null,
            再発行回数: 0,
            最終再発行日時: null,
            金額計算検証ステータス: '未検証',
            金額計算検証日時: null,
            参照関係検証ステータス: '完了',
            createdAt: '2025-06-01T09:00:00Z',
            updatedAt: '2025-06-01T09:00:00Z',
          },
        ]);
      } else if (tableName === 'ユーザー') {
        return Promise.resolve([
          {
            id: '660e8400-e29b-41d4-a716-446655440001',
            ユーザーID: '660e8400-e29b-41d4-a716-446655440001',
            ログインID: 'user_sales_001',
            パスワードハッシュ: 'hash_value_001',
            ユーザー名: '営業太郎',
            メールアドレス: 'taro.sales@example.com',
            ロール: 'sales_staff',
            営業担当者ID: '990e8400-e29b-41d4-a716-446655440004',
            有効フラグ: true,
            最終ログイン日時: '2025-06-15T09:00:00Z',
            作成日時: '2025-01-01T00:00:00Z',
            更新日時: '2025-06-15T09:00:00Z',
            作成者: '660e8400-e29b-41d4-a716-446655440005',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-06-15T09:00:00Z',
          },
        ]);
      } else if (tableName === '請求書修正内容') {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    let createCallCount = 0;
    mockCreateRecord.mockImplementation((tableName: string) => {
      if (tableName === '請求書修正内容') {
        createCallCount++;
        if (createCallCount === 1) {
          return Promise.resolve({
            id: '550e8400-e29b-41d4-a716-446655440010',
            modificationRecordId: '550e8400-e29b-41d4-a716-446655440010',
            invoiceId: '550e8400-e29b-41d4-a716-446655440000',
            modificationDateTime: '2025-06-15T10:30:00Z',
            fieldName: '請求金額',
            previousValue: '100000',
            newValue: '110000',
            modificationReason: '金額計算の誤りを修正',
            modifierUserId: '660e8400-e29b-41d4-a716-446655440001',
            createdAt: '2025-06-15T11:00:00Z',
          });
        } else if (createCallCount === 2) {
          throw new Error('Failed to save modification');
        } else if (createCallCount === 3) {
          return Promise.resolve({
            id: '550e8400-e29b-41d4-a716-446655440012',
            modificationRecordId: '550e8400-e29b-41d4-a716-446655440012',
            invoiceId: '550e8400-e29b-41d4-a716-446655440000',
            modificationDateTime: '2025-06-15T10:30:00Z',
            fieldName: '請求ステータス',
            previousValue: '未請求',
            newValue: '請求済',
            modificationReason: '金額計算の誤りを修正',
            modifierUserId: '660e8400-e29b-41d4-a716-446655440001',
            createdAt: '2025-06-15T11:00:00Z',
          });
        }
      }
      return Promise.resolve({ id: 'mock-id' });
    });

    const input = {
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      modificationDetails: [
        {
          fieldName: '請求金額',
          previousValue: '100000',
          newValue: '110000',
        },
        {
          fieldName: '税額',
          previousValue: '10000',
          newValue: '11000',
        },
        {
          fieldName: '請求ステータス',
          previousValue: '未請求',
          newValue: '請求済',
        },
      ],
      modificationReason: '金額計算の誤りを修正',
      modificationDateTime: new Date('2025-06-15T10:30:00Z'),
      currentDateTime: new Date('2025-06-15T11:00:00Z'),
      modifierUserId: '660e8400-e29b-41d4-a716-446655440001',
    };

    const result = await recordModificationWithHistory(input);

    expect(result.status).toBe('partial_failure');
    expect(result.modificationCount).toBe(2);
    expect(result.invoiceId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.modificationDateTime).toEqual(new Date('2025-06-15T10:30:00Z'));
    expect(result.modificationRecordId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });
});
