import { generateProcessDataflowDiagram } from '../../src/logic/process-dataflow-mapping';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-616: Filtered by multiple sales representatives shows only specified rep data', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should include only data from specified sales representatives', async () => {
    const mockDataPersistence = dataPersistence as jest.Mocked<typeof dataPersistence>;

    const deals = [
      {
        dealId: 'deal001',
        dealName: 'A社案件',
        customerId: 'cust001',
        salesRepId: 'rep001',
        stageId: 'stage02',
        amount: 1000000,
        createdAt: '2024-01-10T08:00:00Z',
        updatedAt: '2024-01-15T09:30:00Z',
      },
      {
        dealId: 'deal002',
        dealName: 'B社案件',
        customerId: 'cust002',
        salesRepId: 'rep002',
        stageId: 'stage03',
        amount: 500000,
        createdAt: '2024-01-12T08:00:00Z',
        updatedAt: '2024-01-18T14:00:00Z',
      },
      {
        dealId: 'deal003',
        dealName: 'C社案件',
        customerId: 'cust003',
        salesRepId: 'rep003',
        stageId: 'stage01',
        amount: 750000,
        createdAt: '2024-01-05T08:00:00Z',
        updatedAt: '2024-01-20T11:00:00Z',
      },
    ];

    const invoices = [
      {
        invoiceId: 'inv001',
        dealId: 'deal001',
        invoiceNumber: 'INV-2024-001',
        totalAmount: 1000000,
        lineItems: [{
          lineItemId: 'line001',
          productName: '商品A',
          quantity: 10,
          unitPrice: 100000,
          amount: 1000000,
        }],
        createdAt: '2024-01-16T10:00:00Z',
      },
      {
        invoiceId: 'inv002',
        dealId: 'deal002',
        invoiceNumber: 'INV-2024-002',
        totalAmount: 500000,
        lineItems: [{
          lineItemId: 'line002',
          productName: '商品B',
          quantity: 5,
          unitPrice: 100000,
          amount: 500000,
        }],
        createdAt: '2024-01-19T11:00:00Z',
      },
    ];

    const activities = [
      {
        activityId: 'act001',
        dealId: 'deal001',
        salesRepId: 'rep001',
        activityType: 'call',
        description: '初回接触',
        createdAt: '2024-01-10T08:30:00Z',
      },
      {
        activityId: 'act002',
        dealId: 'deal002',
        salesRepId: 'rep002',
        activityType: 'meeting',
        description: '提案説明',
        createdAt: '2024-01-13T09:00:00Z',
      },
      {
        activityId: 'act003',
        dealId: 'deal003',
        salesRepId: 'rep003',
        activityType: 'email',
        description: '資料送付',
        createdAt: '2024-01-08T14:00:00Z',
      },
    ];

    const customers = [
      { customerId: 'cust001', customerName: 'A社', industry: '製造業', createdAt: '2023-12-01T08:00:00Z' },
      { customerId: 'cust002', customerName: 'B社', industry: 'IT業', createdAt: '2023-12-05T08:00:00Z' },
      { customerId: 'cust003', customerName: 'C社', industry: '建設業', createdAt: '2023-11-20T08:00:00Z' },
    ];

    const salesReps = [
      { salesRepId: 'rep001', name: '営業太郎', department: '営業部', createdAt: '2023-10-01T08:00:00Z' },
      { salesRepId: 'rep002', name: '営業花子', department: '営業部', createdAt: '2023-10-01T08:00:00Z' },
      { salesRepId: 'rep003', name: '営業次郎', department: '営業部2課', createdAt: '2023-10-05T08:00:00Z' },
    ];

    const stages = [
      { stageId: 'stage01', stageName: '初期接触', sequence: 1 },
      { stageId: 'stage02', stageName: '提案', sequence: 2 },
      { stageId: 'stage03', stageName: '契約待ち', sequence: 3 },
    ];

    mockDataPersistence.fetchDealsForPeriod = jest.fn().mockResolvedValue(deals);
    mockDataPersistence.fetchInvoiceWithLineItems = jest.fn().mockResolvedValue(invoices);
    mockDataPersistence.fetchActivityWithRelatedDealAndInvoice = jest.fn().mockResolvedValue(activities);
    mockDataPersistence.fetchAllCustomers = jest.fn().mockResolvedValue(customers);
    mockDataPersistence.fetchAllSalesRepresentatives = jest.fn().mockResolvedValue(salesReps);
    mockDataPersistence.fetchAllDealStages = jest.fn().mockResolvedValue(stages);

    const filterCriteria = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      salesRepresentativeIds: ['rep001', 'rep002'],
    };

    const input = {
      filterCriteria,
      displayFormat: 'diagram' as const,
      includeAnomalies: true,
      requestedAt: new Date('2024-02-01T10:00:00Z'),
    };

    const result = await generateProcessDataflowDiagram(input);

    const nodeRecordIds = result.dataflowNodes.map(n => n.recordId);
    expect(nodeRecordIds).toContain('deal001');
    expect(nodeRecordIds).toContain('deal002');
    expect(nodeRecordIds).not.toContain('deal003');
    expect(nodeRecordIds).toContain('cust001');
    expect(nodeRecordIds).toContain('cust002');
    expect(nodeRecordIds).not.toContain('cust003');
    expect(nodeRecordIds).toContain('rep001');
    expect(nodeRecordIds).toContain('rep002');
    expect(nodeRecordIds).not.toContain('rep003');

    expect(result.summary).toBeDefined();
    expect(result.generatedAt).toEqual(new Date('2024-02-01T10:00:00Z'));
  });
});
