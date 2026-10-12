import { generateProcessDataflowDiagram } from '../../src/logic/process-dataflow-mapping';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-619: dataflowNode represents 5 stages accurately', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate nodes for all 5 stages: customer, representative, activity, deal, invoice', async () => {
    const mockDataPersistence = dataPersistence as jest.Mocked<typeof dataPersistence>;

    const customers = [
      { id: 'cust-001', name: '株式会社ABC', type: 'customer' },
      { id: 'cust-002', name: '株式会社XYZ', type: 'customer' },
    ];

    const salesReps = [
      { id: 'rep-001', name: '山田太郎', departmentId: 'dept-001' },
      { id: 'rep-002', name: '佐藤花子', departmentId: 'dept-001' },
    ];

    const stages = [
      { id: 'stage-001', name: '初期接触', sequenceOrder: 1 },
      { id: 'stage-002', name: '提案', sequenceOrder: 2 },
      { id: 'stage-003', name: '交渉', sequenceOrder: 3 },
      { id: 'stage-004', name: '成約', sequenceOrder: 4 },
    ];

    const deals = [
      {
        id: 'deal-001',
        customerId: 'cust-001',
        salesRepresentativeId: 'rep-001',
        stageId: 'stage-004',
        amount: 500000,
        createdDate: '2025-01-05T09:00:00Z',
        closedDate: '2025-01-20T15:30:00Z',
      },
      {
        id: 'deal-002',
        customerId: 'cust-002',
        salesRepresentativeId: 'rep-002',
        stageId: 'stage-002',
        amount: 300000,
        createdDate: '2025-01-10T10:00:00Z',
        closedDate: null,
      },
    ];

    const activities = [
      {
        id: 'activity-001',
        dealId: 'deal-001',
        customerId: 'cust-001',
        salesRepresentativeId: 'rep-001',
        type: 'meeting',
        activityDate: '2025-01-15T14:00:00Z',
        description: '初回提案',
      },
      {
        id: 'activity-002',
        dealId: 'deal-002',
        customerId: 'cust-002',
        salesRepresentativeId: 'rep-002',
        type: 'call',
        activityDate: '2025-01-18T11:00:00Z',
        description: '進捗確認',
      },
    ];

    const invoices = [{
      id: 'invoice-001',
      dealId: 'deal-001',
      customerId: 'cust-001',
      invoiceDate: '2025-01-21T00:00:00Z',
      totalAmount: 500000,
      status: 'issued',
      lineItems: [{
        id: 'line-001',
        invoiceId: 'invoice-001',
        description: 'システム構築費',
        unitPrice: 500000,
        quantity: 1,
        amount: 500000,
      }],
    }];

    mockDataPersistence.fetchDealsForPeriod = jest.fn().mockResolvedValue(deals);
    mockDataPersistence.fetchInvoiceWithLineItems = jest.fn().mockResolvedValue(invoices);
    mockDataPersistence.fetchActivityWithRelatedDealAndInvoice = jest.fn().mockResolvedValue(activities);
    mockDataPersistence.fetchAllCustomers = jest.fn().mockResolvedValue(customers);
    mockDataPersistence.fetchAllSalesRepresentatives = jest.fn().mockResolvedValue(salesReps);
    mockDataPersistence.fetchAllDealStages = jest.fn().mockResolvedValue(stages);

    const filterCriteria = {
      startDate: new Date('2025-01-01T00:00:00Z'),
      endDate: new Date('2025-01-31T23:59:59Z'),
      salesRepresentativeIds: [],
      customerIds: [],
    };

    const input = {
      filterCriteria,
      displayFormat: 'diagram' as const,
      includeAnomalies: true,
      requestedAt: new Date('2025-02-01T10:00:00Z'),
    };

    const result = await generateProcessDataflowDiagram(input);

    const stages_in_result = new Set(result.dataflowNodes.map(n => n.stage));
    expect(stages_in_result).toContain('customer');
    expect(stages_in_result).toContain('representative');
    expect(stages_in_result).toContain('activity');
    expect(stages_in_result).toContain('deal');
    expect(stages_in_result).toContain('invoice');

    const customerNodes = result.dataflowNodes.filter(n => n.stage === 'customer');
    expect(customerNodes.length).toBeGreaterThan(0);
    expect(customerNodes).toContainEqual(
      expect.objectContaining({
        recordId: 'cust-001',
        recordName: '株式会社ABC',
      })
    );

    const dealNodes = result.dataflowNodes.filter(n => n.stage === 'deal');
    expect(dealNodes.length).toBeGreaterThan(0);

    const invoiceNodes = result.dataflowNodes.filter(n => n.stage === 'invoice');
    expect(invoiceNodes.length).toBeGreaterThan(0);
  });
});
