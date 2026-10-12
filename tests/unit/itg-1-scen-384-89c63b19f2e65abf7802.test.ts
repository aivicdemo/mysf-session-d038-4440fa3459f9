import { detectDataflowAnomalies, DetectDataflowAnomaliesInput, DataflowExtractionFailed } from '../../src/logic/dataflow-anomaly-detection';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchActivitiesByCustomer: jest.fn(),
  fetchActivitiesByRepresentative: jest.fn(),
  fetchDealsWithInvoices: jest.fn(),
  fetchAllSalesRepresentatives: jest.fn(),
  fetchAllCustomers: jest.fn(),
}));

describe('SCEN-384: データフロー抽出処理が失敗した場合、DataflowExtractionFailed エラーが発生', () => {
  it('should throw DataflowExtractionFailed when extraction process fails', async () => {
    // Mock data-persistence functions to simulate database connection failure
    (dataPersistence.fetchActivitiesByCustomer as jest.Mock).mockRejectedValue(
      new Error('Database connection failed')
    );

    const input: DetectDataflowAnomaliesInput = {
      targetPeriodStartDate: new Date('2024-01-01T00:00:00Z'),
      targetPeriodEndDate: new Date('2024-01-31T23:59:59Z'),
      executedByUserId: 'user-001',
    };

    await expect(detectDataflowAnomalies(input)).rejects.toThrow(DataflowExtractionFailed);
    await expect(detectDataflowAnomalies(input)).rejects.toThrow(
      'データフローレコードの抽出に失敗しました。'
    );
  });
});
