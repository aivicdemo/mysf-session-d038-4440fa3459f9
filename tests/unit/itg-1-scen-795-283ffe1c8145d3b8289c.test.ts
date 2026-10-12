import { fetchInvoicesForPeriod, InvalidPeriodRange } from '../../src/logic/data-persistence';

describe('SCEN-795: 期間開始日時が期間終了日時より後である場合にエラーを返す', () => {
  it('should throw InvalidPeriodRange error when periodStartDateTime is after periodEndDateTime', async () => {
    const input = {
      periodStartDateTime: '2024-01-15T10:30:00Z',
      periodEndDateTime: '2024-01-10T09:00:00Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      invoiceStatusFilter: null,
      sortBy: 'updatedAt' as const,
    };

    await expect(fetchInvoicesForPeriod(input)).rejects.toThrow(InvalidPeriodRange);
    await expect(fetchInvoicesForPeriod(input)).rejects.toThrow('期間開始日時は期間終了日時以前である必要があります。');
  });
});
