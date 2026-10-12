import { aggregateSalesPerformanceForDashboard, TargetPeriodInFuture } from '../../src/logic/sales-performance-aggregation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-399: TargetPeriodInFuture error when targetPeriod is after current date', () => {
  it('should throw TargetPeriodInFuture error when targetPeriod "2025-12" is after currentDate "2025-11-30"', async () => {
    const input = {
      targetPeriod: '2025-12',
      currentDate: new Date('2025-11-30T10:00:00Z'),
      requestingUserId: 'user-001',
    };

    await expect(aggregateSalesPerformanceForDashboard(input)).rejects.toThrow(TargetPeriodInFuture);
    await expect(aggregateSalesPerformanceForDashboard(input)).rejects.toThrow(
      '集計対象期間は現在以前の月を指定してください。'
    );
  });
});
