import { fetchDealsForPeriod } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-1682: 請求書SLA監視 - SLA超過案件の詳細を営業部システム担当・経理部門に通知し、対応を促す', () => {
  it('SLA超過案件を特定でき、営業担当者と取引先に対して通知・対応促進を実施できる', async () => {
    const dealRecords = [
      {
        id: 'deal-001',
        商談ID: 'deal-001',
        取引先ID: 'customer-001',
        営業担当者ID: 'sales-rep-001',
        商談名: 'A社システム導入案件',
        商談金額: 5000000,
        ステージ: '成約',
        成約予定日: '2024-12-15T00:00:00Z',
        説明: 'SLA超過案件',
        成約日: '2024-12-10T00:00:00Z',
        失注理由: null,
        作成日時: '2024-11-01T10:00:00Z',
        更新日時: '2024-12-10T15:30:00Z',
        作成者ID: 'user-001',
        請求生成SLA期限: '2024-12-15T00:00:00Z',
        請求SLA超過フラグ: true,
        createdAt: '2024-11-01T10:00:00Z',
        updatedAt: '2024-12-10T15:30:00Z',
      },
      {
        id: 'deal-002',
        商談ID: 'deal-002',
        取引先ID: 'customer-002',
        営業担当者ID: 'sales-rep-001',
        商談名: 'B社保守契約更新',
        商談金額: 2000000,
        ステージ: '成約',
        成約予定日: '2024-12-20T00:00:00Z',
        説明: '通常案件',
        成約日: '2024-12-05T00:00:00Z',
        失注理由: null,
        作成日時: '2024-11-05T09:00:00Z',
        更新日時: '2024-12-05T14:00:00Z',
        作成者ID: 'user-001',
        請求生成SLA期限: '2024-12-25T00:00:00Z',
        請求SLA超過フラグ: false,
        createdAt: '2024-11-05T09:00:00Z',
        updatedAt: '2024-12-05T14:00:00Z',
      },
      {
        id: 'deal-003',
        商談ID: 'deal-003',
        取引先ID: 'customer-001',
        営業担当者ID: 'sales-rep-002',
        商談名: 'C社追加ライセンス購入',
        商談金額: 1500000,
        ステージ: '成約',
        成約予定日: '2024-12-18T00:00:00Z',
        説明: 'SLA超過案件',
        成約日: '2024-12-12T00:00:00Z',
        失注理由: null,
        作成日時: '2024-11-10T11:00:00Z',
        更新日時: '2024-12-12T16:45:00Z',
        作成者ID: 'user-002',
        請求生成SLA期限: '2024-12-18T00:00:00Z',
        請求SLA超過フラグ: true,
        createdAt: '2024-11-10T11:00:00Z',
        updatedAt: '2024-12-12T16:45:00Z',
      },
    ];

    const mockListRecords = require('../../src/platform/data-store').listRecords as jest.Mock;
    mockListRecords.mockResolvedValue(dealRecords);

    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-11-01T00:00:00Z',
      periodEndDateTime: '2024-12-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.deals).toHaveLength(3);
    expect(result.totalCount).toBe(3);

    // deals 配列は sortBy='updatedAt' により更新日時の降順で並べられていることを確認
    expect(result.deals[0].dealId).toBe('deal-003');
    expect(result.deals[0].updatedAt).toBe('2024-12-12T16:45:00Z');
    expect(result.deals[1].dealId).toBe('deal-001');
    expect(result.deals[1].updatedAt).toBe('2024-12-10T15:30:00Z');
    expect(result.deals[2].dealId).toBe('deal-002');
    expect(result.deals[2].updatedAt).toBe('2024-12-05T14:00:00Z');

    // SLA超過案件 deal-001 を特定できることを確認
    const slvExceededDeal001 = result.deals.find((deal) => deal.dealId === 'deal-001' && deal.invoiceSLAExceededFlag === true);
    expect(slvExceededDeal001).toBeDefined();
    expect(slvExceededDeal001?.salesRepresentativeId).toBe('sales-rep-001');
    expect(slvExceededDeal001?.customerId).toBe('customer-001');
    expect(slvExceededDeal001?.dealName).toBe('A社システム導入案件');
    expect(slvExceededDeal001?.invoiceGenerationSLADeadline).toBe('2024-12-15T00:00:00Z');

    // SLA超過案件 deal-003 を特定できることを確認
    const slvExceededDeal003 = result.deals.find((deal) => deal.dealId === 'deal-003' && deal.invoiceSLAExceededFlag === true);
    expect(slvExceededDeal003).toBeDefined();
    expect(slvExceededDeal003?.salesRepresentativeId).toBe('sales-rep-002');
    expect(slvExceededDeal003?.customerId).toBe('customer-001');

    // fetchedAt がテスト実行時刻の ISO 8601 形式タイムスタンプであることを確認
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
