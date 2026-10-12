import { recordModificationWithHistory, IncompleteModificationDetails } from '../../src/logic/modification-tracking';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-640: 修正内容配列の要素の変更後値が空文字列またはnullの場合', () => {
  it('IncompleteModificationDetailsエラーを返す', async () => {
    const invoiceData = {
      請求書ID: '550e8400-e29b-41d4-a716-446655440000',
      商談ID: '770e8400-e29b-41d4-a716-446655440002',
      取引先ID: '880e8400-e29b-41d4-a716-446655440003',
      営業担当者ID: '990e8400-e29b-41d4-a716-446655440004',
      請求書番号: 'INV-2026-001',
      請求日: '2026-10-05T09:00:00Z',
      支払期限日: '2026-11-05T23:59:59Z',
      請求金額: 100000,
      税額: 10000,
      税抜金額: 90000,
      請求ステータス: '未入金',
      入金日: null,
      入金金額: 0,
      摘要: '通常請求',
      作成日時: '2026-10-05T08:00:00Z',
      更新日時: '2026-10-05T08:00:00Z',
      作成者: 'system',
      修正前請求金額: null,
      修正理由: null,
      再発行回数: 0,
      最終再発行日時: null,
      金額計算検証ステータス: '完了',
      金額計算検証日時: '2026-10-05T08:30:00Z',
      参照関係検証ステータス: '完了',
    };

    const userData = {
      ユーザーID: '660e8400-e29b-41d4-a716-446655440001',
      ログインID: 'modifier_user',
      パスワードハッシュ: '$2b$10$abcdefghijklmnopqrstuvwxyz',
      ユーザー名: '修正者ユーザー',
      メールアドレス: 'modifier@example.com',
      ロール: '営業部システム担当',
      営業担当者ID: '990e8400-e29b-41d4-a716-446655440004',
      有効フラグ: true,
      最終ログイン日時: '2026-10-07T09:00:00Z',
      作成日時: '2026-09-01T00:00:00Z',
      更新日時: '2026-10-07T09:00:00Z',
      作成者: '550e8400-e29b-41d4-a716-446655440000',
    };

    const mockListRecords = jest.fn((tableName: string) => {
      if (tableName === '請求書') {
        return Promise.resolve([invoiceData]);
      }
      if (tableName === 'ユーザー') {
        return Promise.resolve([userData]);
      }
      return Promise.resolve([]);
    });

    (dataStore.listRecords as jest.Mock).mockImplementation(mockListRecords);

    await expect(
      recordModificationWithHistory({
        invoiceId: '550e8400-e29b-41d4-a716-446655440000',
        modificationDetails: [
          {
            fieldName: '請求金額',
            previousValue: '100000',
            newValue: '',
          },
        ],
        modificationReason: '営業担当者からの修正依頼による金額訂正',
        modificationDateTime: new Date('2026-10-07T10:00:00Z'),
        currentDateTime: new Date('2026-10-07T12:00:00Z'),
        modifierUserId: '660e8400-e29b-41d4-a716-446655440001',
      })
    ).rejects.toThrow(IncompleteModificationDetails);
  });
});
