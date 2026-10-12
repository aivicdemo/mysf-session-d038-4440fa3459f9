import { generateProcessDataflowDiagram } from '../../src/logic/process-dataflow-mapping';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-617: Filtered by specific customer shows only complete flow for that customer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should include only data related to specified customer', async () => {
    const mockDataPersistence = dataPersistence as jest.Mocked<typeof dataPersistence>;

    const customers = [
      { id: 'CUST-12345', name: 'ABC商事', accountId: 'ACC-12345' },
      { id: 'CUST-67890', name: 'XYZ工業', accountId: 'ACC-67890' },
    ];

    const salesReps = [
      { id: 'SR-001', name: '営業太郎', customerId: 'CUST-12345' },
      { id: 'SR-002', name: '営業花子', customerId: 'CUST-67890' },
    ];

    const stages = [
      { id: 'STAGE-01', name: '提案', order: 1 },
      { id: 'STAGE-02', name: '交渉', order: 2 },
      { id: 'STAGE-03', name: '受注', order: 3 },
    ];

    const deals = [
      {
        id: 'DEAL-12345',
        customerId: 'CUST-12345',
        name: 'A社システム導入',
        amount: 5000000,
        stageId: 'STAGE-03',
        createdDate: '2024-01-15T09:30:00Z',
        closedDate: '2024-02-28T17:00:00Z',
      },
      {
        id: 'DEAL-67890',
        customerId: 'CUST-67890',
        name: 'B社保守契約',
        amount: 2000000,
        stageId: 'STAGE-02',
        createdDate: '2024-02-01T10:00:00Z',
        closedDate: null,
      },
    ];

    const activities = [
      {
        id: 'ACT-001',
        dealId: 'DEAL-12345',
        customerId: 'CUST-12345',
        salesRepId: 'SR-001',
        type: 'meeting',
        date: '2024-01-20T14:00:00Z',
        invoiceId: 'INV-12345',
      },
      {
        id: 'ACT-002',
        dealId: 'DEAL-12345',
        customerId: 'CUST-12345',
        salesRepId: 'SR-001',
        type: 'call',
        date: '2024-02-10T10:30:00Z',
        invoiceId: 'INV-12345',
      },
    ];

    const invoices = [{
      id: 'INV-12345',
      dealId: 'DEAL-12345',
      customerId: 'CUST-12345',
      amount: 5000000,
      date: '2024-03-01T00:00:00Z',
      lineItems: [{
        id: 'LI-001',
        invoiceId: 'INV-12345',
        description: 'システム導入費',
        amount: 5000000,
        quantity: 1,
      }],
    }];

    mockDataPersistence.fetchDealsForPeriod = jest.fn().mockResolvedValue(deals);
    mockDataPersistence.fetchInvoiceWithLineItems = jest.fn().mockResolvedValue(invoices);
    mockDataPersistence.fetchActivityWithRelatedDealAndInvoice = jest.fn().mockResolvedValue(activities);
    mockDataPersistence.fetchAllCustomers = jest.fn().mockResolvedValue(customers);
    mockDataPersistence.fetchAllSalesRepresentatives = jest.fn().mockResolvedValue(salesReps);
    mockDataPersistence.fetchAllDealStages = jest.fn().mockResolvedValue(stages);

    const filterCriteria = {
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-03-31T23:59:59Z'),
      customerIds: ['CUST-12345'],
    };

    const input = {
      filterCriteria,
      displayFormat: 'diagram' as const,
      includeAnomalies: true,
      requestedAt: new Date('2024-04-01T10:00:00Z'),
    };

    const result = await generateProcessDataflowDiagram(input);

    const nodeRecordIds = result.dataflowNodes.map(n => n.recordId);
    expect(nodeRecordIds).toContain('CUST-12345');
    expect(nodeRecordIds).toContain('DEAL-12345');
    expect(nodeRecordIds).toContain('INV-12345');
    expect(nodeRecordIds).toContain('SR-001');
    expect(nodeRecordIds).toContain('ACT-001');
    expect(nodeRecordIds).toContain('ACT-002');

    expect(nodeRecordIds).not.toContain('CUST-67890');
    expect(nodeRecordIds).not.toContain('DEAL-67890');
    expect(nodeRecordIds).not.toContain('SR-002');

    expect(result.anomalies).toEqual([]);
    expect(result.generatedAt).toEqual(new Date('2024-04-01T10:00:00Z'));
  });
});
