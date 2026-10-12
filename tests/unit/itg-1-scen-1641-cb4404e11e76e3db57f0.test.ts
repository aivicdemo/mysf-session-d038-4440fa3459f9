import { fetchDealsForPeriod, PeriodValidationError } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store');

describe('SCEN-1641: 期間の開始日時が終了日時より後の場合、PeriodValidationError が発生', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('期間の開始日時が終了日時より後である場合、PeriodValidationError が発生する', async () => {
    const input = {
      periodStartDateTime: '2024-12-11T00:00:00Z',
      periodEndDateTime: '2024-12-09T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt' as const,
    };

    await expect(fetchDealsForPeriod(input)).rejects.toThrow(PeriodValidationError);
  });

  it('エラーメッセージが「期間の開始日時は終了日時より前である必要があります。」である', async () => {
    const input = {
      periodStartDateTime: '2024-12-11T00:00:00Z',
      periodEndDateTime: '2024-12-09T23:59:59Z',
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
