import { fetchDealsForPeriod, PeriodValidationError } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store.ts', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
}));

describe('SCEN-1673: 許容閾値が負の数の場合、エラーがスローされる', () => {
  it('PeriodValidationError がスローされ、エラー文言は「期間の開始日時は終了日時より前である必要があります。」である', async () => {
    const input = {
      periodStartDateTime: '2025-01-15T10:00:00Z',
      periodEndDateTime: '-100' as any,
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt' as const,
    };

    await expect(fetchDealsForPeriod(input)).rejects.toThrow(PeriodValidationError);
    await expect(fetchDealsForPeriod(input)).rejects.toThrow('期間の開始日時は終了日時より前である必要があります。');
  });
});
