import { generateProcessDataflowDiagram, DataflowExtractionFailure } from '../../src/logic/process-dataflow-mapping';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-608: DataflowExtractionFailure when data extraction fails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataflowExtractionFailure when fetchDealsForPeriod fails', async () => {
    const mockDataPersistence = dataPersistence as jest.Mocked<typeof dataPersistence>;

    mockDataPersistence.fetchDealsForPeriod = jest.fn().mockRejectedValue(new Error('Data fetch error'));
    mockDataPersistence.fetchInvoiceWithLineItems = jest.fn().mockResolvedValue([]);
    mockDataPersistence.fetchActivityWithRelatedDealAndInvoice = jest.fn().mockResolvedValue([]);
    mockDataPersistence.fetchAllCustomers = jest.fn().mockResolvedValue([]);
    mockDataPersistence.fetchAllSalesRepresentatives = jest.fn().mockResolvedValue([]);
    mockDataPersistence.fetchAllDealStages = jest.fn().mockResolvedValue([]);

    const filterCriteria = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      salesRepresentativeIds: [],
      customerIds: [],
    };

    const input = {
      filterCriteria,
      displayFormat: 'diagram' as const,
      includeAnomalies: true,
      requestedAt: new Date('2024-02-01T10:00:00Z'),
    };

    await expect(generateProcessDataflowDiagram(input)).rejects.toThrow(DataflowExtractionFailure);

    try {
      await generateProcessDataflowDiagram(input);
    } catch (error) {
      if (error instanceof DataflowExtractionFailure) {
        expect(error.message).toBe('営業プロセスデータの抽出に失敗しました。対象期間とフィルター条件を確認してください。');
      }
    }
  });
});
