import { fetchDealsForPeriod, PeriodValidationError } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store');

describe('SCEN-1642: 期間の開始日時が終了日時より後の場合、PeriodValidationError が発生', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('期間の開始日時が終了日時より後である場合、PeriodValidationError が発生する', async () => {
    const input = {
      periodStartDateTime: '2024-01-15T10:00:00Z',
      periodEndDateTime: '2024-01-10T18:00:00Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt' as const,
    };

    await expect(fetchDealsForPeriod(input)).rejects.toThrow(PeriodValidationError);
  });

  it('エラーメッセージが「期間の開始日時は終了日時より前である必要があります。」である', async () => {
    const input = {
      periodStartDateTime: '2024-01-15T10:00:00Z',
      periodEndDateTime: '2024-01-10T18:00:00Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt' as const,
    };

    await expect(fetchDealsForPeriod(input)).rejects.toThrow(
      '期間の開始日時は終了日時より前である必要があります。'
    );
  });
});
