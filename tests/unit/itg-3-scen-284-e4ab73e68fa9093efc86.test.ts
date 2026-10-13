import { renderDashboardWithLatestData, RenderDashboardWithLatestDataInput, InvalidDateRangeError } from '../../src/logic/dashboard-presentation';

jest.mock('../../src/logic/discrepancy-persistence');

describe('SCEN-284: renderDashboardWithLatestData - 開始日が終了日より後の場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('InvalidDateRangeError が発生する', async () => {
    const input: RenderDashboardWithLatestDataInput = {
      requestUserId: 'user-001',
      startDate: new Date('2024-12-31'),
      endDate: new Date('2024-12-25')
    };

    await expect(renderDashboardWithLatestData(input)).rejects.toThrow(InvalidDateRangeError);
    await expect(renderDashboardWithLatestData(input)).rejects.toThrow(
      '照合期間の開始日は終了日以前である必要があります。'
    );
  });
});
