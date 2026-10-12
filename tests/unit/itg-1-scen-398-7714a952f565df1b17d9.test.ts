import { aggregateSalesPerformanceForDashboard, InvalidTargetPeriodFormat } from '../../src/logic/sales-performance-aggregation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-398: InvalidTargetPeriodFormat error when targetPeriod is not YYYY-MM format', () => {
  it('should throw InvalidTargetPeriodFormat error when targetPeriod is "2024/13"', async () => {
    const input = {
      targetPeriod: '2024/13',
      currentDate: new Date('2024-10-15T10:30:00Z'),
      requestingUserId: 'user-001',
    };

    await expect(aggregateSalesPerformanceForDashboard(input)).rejects.toThrow(InvalidTargetPeriodFormat);
    await expect(aggregateSalesPerformanceForDashboard(input)).rejects.toThrow(
      '集計対象期間の形式が不正です。YYYY-MM形式で指定してください。'
    );
  });
});
