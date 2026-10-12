import { fetchInvoicesForPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-810: 取得実行日時を ISO 8601 形式で返す', () => {
  it('fetchedAt が ISO 8601 形式の有効な日時文字列として返される', async () => {
    const invoiceTableData = [
      {
        id: 'inv-001',
        請求書ID: 'uuid-001',
        商談ID: 'deal-001',
        取引先ID: 'cust-001',
        営業担当者ID: 'sales-001',
        請求書番号: 'INV-2024-001',
        請求日: '2024-01-15T10:30:00Z',
        支払期限日: '2024-02-15T23:59:59Z',
        請求金額: 100000,
        税額: 10000,
        税抜金額: 90000,
        請求ステータス: 'issued',
        入金日: null,
        入金金額: 0,
        摘要: 'サービス提供分',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        作成者: 'admin',
        修正前請求金額: null,
        修正理由: null,
        再発行回数: 0,
        最終再発行日時: null,
        金額計算検証ステータス: 'verified',
        金額計算検証日時: '2024-01-15T10:35:00Z',
        参照関係検証ステータス: 'verified',
      },
      {
        id: 'inv-002',
        請求書ID: 'uuid-002',
        商談ID: 'deal-002',
        取引先ID: 'cust-002',
        営業担当者ID: 'sales-002',
        請求書番号: 'INV-2024-002',
        請求日: '2024-01-20T14:15:00Z',
        支払期限日: '2024-02-20T23:59:59Z',
        請求金額: 250000,
        税額: 25000,
        税抜金額: 225000,
        請求ステータス: 'paid',
        入金日: '2024-01-25T09:00:00Z',
        入金金額: 250000,
        摘要: 'コンサルティング費用',
        createdAt: '2024-01-20T14:15:00Z',
        updatedAt: '2024-01-25T09:00:00Z',
        作成者: 'admin',
        修正前請求金額: null,
        修正理由: null,
        再発行回数: 0,
        最終再発行日時: null,
        金額計算検証ステータス: 'verified',
        金額計算検証日時: '2024-01-20T14:20:00Z',
        参照関係検証ステータス: 'verified',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(invoiceTableData);

    const result = await fetchInvoicesForPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      invoiceStatusFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
    expect(result.invoices).toHaveLength(2);
    expect(result.invoices[0].updatedAt).toBe('2024-01-15T10:30:00Z');
    expect(result.invoices[1].updatedAt).toBe('2024-01-25T09:00:00Z');
    expect(result.totalCount).toBe(2);
  });
});
