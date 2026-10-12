import { fetchDealsForPeriod, PeriodValidationError } from '../../src/logic/data-persistence';

describe('fetchDealsForPeriod', () => {
  describe('SCEN-788: Period validation error when start date is after end date', () => {
    it('should throw PeriodValidationError when periodStartDateTime is after periodEndDateTime', async () => {
      const input = {
        periodStartDateTime: '2025-01-15T10:00:00Z',
        periodEndDateTime: '2025-01-10T15:00:00Z',
        salesRepresentativeIdFilter: null,
        customerIdFilter: null,
        stageIdFilter: null,
        sortBy: 'updatedAt' as const,
      };

      await expect(fetchDealsForPeriod(input)).rejects.toThrow(PeriodValidationError);
      await expect(fetchDealsForPeriod(input)).rejects.toThrow('期間の開始日時は終了日時より前である必要があります。');
    });
  });
});
