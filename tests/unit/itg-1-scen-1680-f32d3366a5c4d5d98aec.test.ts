import { fetchDealsForPeriod } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-1680: 請求書SLA監視 - 請求漏れ・遅延の有無を判定し、優先度を分類して対応対象を整理する', () => {
  it('期間内に作成または更新された商談レコードをすべて含み、期間内のレコードのみでソートして返される', async () => {
    const dealRecords = [
      {
        id: 'deal-001',
        商談ID: 'deal-001',
        取引先ID: 'customer-001',
        営業担当者ID: 'sales-rep-001',
        商談名: 'A社 システム導入案件',
        商談金額: 5000000,
        ステージ: '提案',
        成約予定日: '2024-12-31T23:59:59Z',
        説明: '大型案件',
        成約日: null,
        失注理由: null,
        作成日時: '2024-11-01T10:00:00Z',
        更新日時: '2024-11-15T14:30:00Z',
        作成者ID: 'user-001',
        請求生成SLA期限: '2025-01-15T23:59:59Z',
        請求SLA超過フラグ: false,
        createdAt: '2024-11-01T10:00:00Z',
        updatedAt: '2024-11-15T14:30:00Z',
      },
      {
        id: 'deal-002',
        商談ID: 'deal-002',
        取引先ID: 'customer-002',
        営業担当者ID: 'sales-rep-001',
        商談名: 'B社 保守契約',
        商談金額: 1200000,
        ステージ: '成約',
        成約予定日: '2024-11-30T23:59:59Z',
        説明: '年間保守',
        成約日: '2024-11-25T09:00:00Z',
        失注理由: null,
        作成日時: '2024-10-20T08:00:00Z',
        更新日時: '2024-11-25T09:15:00Z',
        作成者ID: 'user-001',
        請求生成SLA期限: '2024-12-10T23:59:59Z',
        請求SLA超過フラグ: true,
        createdAt: '2024-10-20T08:00:00Z',
        updatedAt: '2024-11-25T09:15:00Z',
      },
      {
        id: 'deal-003',
        商談ID: 'deal-003',
        取引先ID: 'customer-003',
        営業担当者ID: 'sales-rep-002',
        商談名: 'C社 コンサルティング',
        商談金額: 800000,
        ステージ: '初期接触',
        成約予定日: '2025-02-28T23:59:59Z',
        説明: '業務改善支援',
        成約日: null,
        失注理由: null,
        作成日時: '2024-11-10T11:00:00Z',
        更新日時: '2024-11-16T16:45:00Z',
        作成者ID: 'user-002',
        請求生成SLA期限: '2025-03-15T23:59:59Z',
        請求SLA超過フラグ: false,
        createdAt: '2024-11-10T11:00:00Z',
        updatedAt: '2024-11-16T16:45:00Z',
      },
      {
        id: 'deal-004',
        商談ID: 'deal-004',
        取引先ID: 'customer-001',
        営業担当者ID: 'sales-rep-002',
        商談名: 'A社 追加ライセンス',
        商談金額: 2500000,
        ステージ: '成約',
        成約予定日: '2024-11-20T23:59:59Z',
        説明: 'ライセンス追加購入',
        成約日: '2024-11-18T10:30:00Z',
        失注理由: null,
        作成日時: '2024-11-05T09:30:00Z',
        更新日時: '2024-11-18T10:45:00Z',
        作成者ID: 'user-002',
        請求生成SLA期限: '2024-12-03T23:59:59Z',
        請求SLA超過フラグ: false,
        createdAt: '2024-11-05T09:30:00Z',
        updatedAt: '2024-11-18T10:45:00Z',
      },
    ];

    const mockListRecords = require('../../src/platform/data-store').listRecords as jest.Mock;
    mockListRecords.mockResolvedValue(dealRecords);

    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-11-01T00:00:00Z',
      periodEndDateTime: '2024-11-30T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.deals).toHaveLength(4);
    expect(result.totalCount).toBe(4);

    // updatedAt の降順でソートされていることを確認
    expect(result.deals[0].updatedAt).toBe('2024-11-25T09:15:00Z');
    expect(result.deals[1].updatedAt).toBe('2024-11-18T10:45:00Z');
    expect(result.deals[2].updatedAt).toBe('2024-11-16T16:45:00Z');
    expect(result.deals[3].updatedAt).toBe('2024-11-15T14:30:00Z');

    // 各商談に請求生成SLA期限と請求SLA超過フラグが含まれていることを確認
    expect(result.deals[0]).toHaveProperty('invoiceGenerationSLADeadline', '2024-12-10T23:59:59Z');
    expect(result.deals[0]).toHaveProperty('invoiceSLAExceededFlag', true);
    expect(result.deals[1]).toHaveProperty('invoiceGenerationSLADeadline', '2024-12-03T23:59:59Z');
    expect(result.deals[1]).toHaveProperty('invoiceSLAExceededFlag', false);

    // fetchedAt が ISO 8601 形式の有効な日時文字列であることを確認
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
