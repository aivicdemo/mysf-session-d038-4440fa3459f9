import { generateProcessDataflowDiagram, NoDataAvailable } from '../../src/logic/process-dataflow-mapping';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-611: NoDataAvailable error when no data matches filter criteria', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw NoDataAvailable when all data sources return empty arrays', async () => {
    const mockDataPersistence = dataPersistence as jest.Mocked<typeof dataPersistence>;

    mockDataPersistence.fetchDealsForPeriod = jest.fn().mockResolvedValue([]);
    mockDataPersistence.fetchInvoiceWithLineItems = jest.fn().mockResolvedValue([]);
    mockDataPersistence.fetchActivityWithRelatedDealAndInvoice = jest.fn().mockResolvedValue([]);
    mockDataPersistence.fetchAllCustomers = jest.fn().mockResolvedValue([]);
    mockDataPersistence.fetchAllSalesRepresentatives = jest.fn().mockResolvedValue([]);
    mockDataPersistence.fetchAllDealStages = jest.fn().mockResolvedValue([]);

    const filterCriteria = {
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2026-01-31T23:59:59Z'),
      salesRepresentativeIds: ['SR-999'],
      customerIds: ['CUST-999'],
    };

    const input = {
      filterCriteria,
      displayFormat: 'diagram' as const,
      includeAnomalies: true,
      requestedAt: new Date('2026-02-01T10:00:00Z'),
    };

    await expect(generateProcessDataflowDiagram(input)).rejects.toThrow(NoDataAvailable);

    try {
      await generateProcessDataflowDiagram(input);
    } catch (error) {
      if (error instanceof NoDataAvailable) {
        expect(error.message).toBe('指定された条件に該当するデータがありません。');
      }
    }
  });
});
