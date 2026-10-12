import { fetchAnomalyDetectionLogsByPeriod, InvalidPeriodRange } from '../../src/logic/data-persistence';

describe('SCEN-924: 期間開始日時が期間終了日時より後の場合、InvalidPeriodRangeエラーが発生する', () => {
  it('should throw InvalidPeriodRange error when periodStartDateTime is after periodEndDateTime', async () => {
    const input = {
      periodStartDateTime: '2025-01-15T10:00:00Z',
      periodEndDateTime: '2025-01-10T10:00:00Z',
      anomalyTypeFilter: null,
      severityFilter: null,
      statusFilter: null,
      sortBy: 'detectionDateTime' as const,
    };

    await expect(fetchAnomalyDetectionLogsByPeriod(input)).rejects.toThrow(InvalidPeriodRange);
    await expect(fetchAnomalyDetectionLogsByPeriod(input)).rejects.toThrow('期間開始日時は期間終了日時以前である必要があります。');
  });
});
