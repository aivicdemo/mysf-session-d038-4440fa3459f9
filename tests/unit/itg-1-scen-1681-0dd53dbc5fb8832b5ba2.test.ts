import { fetchDealsForPeriod } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-1681: 請求書SLA監視 - 検出された請求SLA超過・遅延案件を異常検知ログに記録し、追跡可能にする', () => {
  it('期間内のレコードのうち、請求SLA超過フラグが true のレコードを特定し、異常検知ログ記録対象として識別可能である', async () => {
    const dealRecords = [
      {
        id: 'deal-001',
        商談ID: 'deal-001',
        取引先ID: 'customer-001',
        営業担当者ID: 'rep-001',
        商談名: 'A社システム導入',
        商談金額: 5000000,
        ステージ: 'stage-negotiation',
        成約予定日: '2025-02-15T00:00:00Z',
        説明: 'A社向けシステム導入プロジェクト',
        成約日: null,
        失注理由: null,
        作成日時: '2025-01-01T10:00:00Z',
        更新日時: '2025-01-10T14:30:00Z',
        作成者ID: 'admin-001',
        請求生成SLA期限: '2025-02-20T00:00:00Z',
        請求SLA超過フラグ: true,
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2025-01-10T14:30:00Z',
      },
      {
        id: 'deal-002',
        商談ID: 'deal-002',
        取引先ID: 'customer-002',
        営業担当者ID: 'rep-001',
        商談名: 'B社コンサルティング',
        商談金額: 3000000,
        ステージ: 'stage-proposal',
        成約予定日: '2025-03-01T00:00:00Z',
        説明: 'B社向けコンサルティングサービス',
        成約日: null,
        失注理由: null,
        作成日時: '2025-01-02T09:00:00Z',
        更新日時: '2025-01-05T11:20:00Z',
        作成者ID: 'admin-001',
        請求生成SLA期限: '2025-03-05T00:00:00Z',
        請求SLA超過フラグ: false,
        createdAt: '2025-01-02T09:00:00Z',
        updatedAt: '2025-01-05T11:20:00Z',
      },
      {
        id: 'deal-003',
        商談ID: 'deal-003',
        取引先ID: 'customer-003',
        営業担当者ID: 'rep-002',
        商談名: 'C社保守契約',
        商談金額: 1200000,
        ステージ: 'stage-closed-won',
        成約予定日: '2025-01-20T00:00:00Z',
        説明: 'C社向け保守契約',
        成約日: '2025-01-20T00:00:00Z',
        失注理由: null,
        作成日時: '2024-12-28T08:00:00Z',
        更新日時: '2025-01-06T16:45:00Z',
        作成者ID: 'admin-001',
        請求生成SLA期限: '2025-01-25T00:00:00Z',
        請求SLA超過フラグ: true,
        createdAt: '2024-12-28T08:00:00Z',
        updatedAt: '2025-01-06T16:45:00Z',
      },
    ];

    const mockListRecords = require('../../src/platform/data-store').listRecords as jest.Mock;
    mockListRecords.mockResolvedValue(dealRecords);

    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2025-01-01T00:00:00Z',
      periodEndDateTime: '2025-01-15T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.deals).toHaveLength(2);
    expect(result.totalCount).toBe(2);

    // updatedAt の降順でソートされていることを確認
    expect(result.deals[0].updatedAt).toBe('2025-01-10T14:30:00Z');
    expect(result.deals[1].updatedAt).toBe('2025-01-05T11:20:00Z');

    // deal-001 が請求SLA超過フラグ true で特定可能なことを確認
    const dealWithSLAExceeded = result.deals.find((deal) => deal.dealId === 'deal-001' && deal.invoiceSLAExceededFlag === true);
    expect(dealWithSLAExceeded).toBeDefined();
    expect(dealWithSLAExceeded?.invoiceGenerationSLADeadline).toBe('2025-02-20T00:00:00Z');
    expect(dealWithSLAExceeded?.customerId).toBe('customer-001');
    expect(dealWithSLAExceeded?.salesRepresentativeId).toBe('rep-001');

    // fetchedAt が現在日時（ISO 8601形式）で返されていることを確認
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
