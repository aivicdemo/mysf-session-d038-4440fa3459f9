import { renderDashboardWithLatestData, RenderDashboardWithLatestDataInput, DataRetrievalError } from '../../src/logic/dashboard-presentation';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveMonitoringLogsAndCorrectionHistory: jest.fn()
}));

describe('SCEN-285: renderDashboardWithLatestData - 差異検出結果取得失敗', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('永続化層から差異検出結果取得が失敗した場合、DataRetrievalError が発生する', async () => {
    (discrepancyPersistence.retrieveMonitoringLogsAndCorrectionHistory as jest.Mock).mockResolvedValue(null);

    const input: RenderDashboardWithLatestDataInput = {
      requestUserId: 'user-001',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31')
    };

    await expect(renderDashboardWithLatestData(input)).rejects.toThrow(DataRetrievalError);
    await expect(renderDashboardWithLatestData(input)).rejects.toThrow(
      'ダッシュボード表示用データの取得に失敗しました。'
    );
  });
});
