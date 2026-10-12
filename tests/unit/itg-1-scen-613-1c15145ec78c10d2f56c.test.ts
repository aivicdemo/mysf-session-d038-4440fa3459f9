import { generateProcessDataflowDiagram } from '../../src/logic/process-dataflow-mapping';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-613: displayFormat timeline generates nodes and edges in chronological order', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should format dataflow in timeline order when displayFormat is timeline', async () => {
    const mockDataPersistence = dataPersistence as jest.Mocked<typeof dataPersistence>;

    const deals = [
      {
        dealId: 'DEAL-001',
        customerId: 'CUST-001',
        dealName: '案件A',
        amount: 1000000,
        stageName: '提案',
        createdAt: '2024-01-05T09:00:00Z',
        closedAt: '2024-01-20T15:30:00Z',
      },
      {
        dealId: 'DEAL-002',
        customerId: 'CUST-001',
        dealName: '案件B',
        amount: 500000,
        stageName: '商談中',
        createdAt: '2024-01-10T10:15:00Z',
        closedAt: null,
      },
    ];

    const invoices = [{
      invoiceId: 'INV-001',
      dealId: 'DEAL-001',
      issuedAt: '2024-01-21T08:00:00Z',
      totalAmount: 1000000,
      lineItems: [{
        lineItemId: 'LINE-001',
        productName: 'コンサルティング',
        quantity: 1,
        unitPrice: 1000000,
        createdAt: '2024-01-21T08:00:00Z',
      }],
    }];

    const activities = [
      {
        activityId: 'ACT-001',
        dealId: 'DEAL-001',
        activityType: '電話',
        subject: 'ヒアリング',
        occurredAt: '2024-01-05T14:00:00Z',
      },
      {
        activityId: 'ACT-002',
        dealId: 'DEAL-001',
        activityType: '訪問',
        subject: '提案プレゼン',
        occurredAt: '2024-01-15T11:00:00Z',
      },
      {
        activityId: 'ACT-003',
        dealId: 'DEAL-002',
        activityType: 'メール',
        subject: '提案資料送付',
        occurredAt: '2024-01-12T09:30:00Z',
      },
    ];

    const customers = [{
      customerId: 'CUST-001',
      customerName: '株式会社ABC',
      industry: '製造業',
      registeredAt: '2023-06-01T00:00:00Z',
    }];

    const salesReps = [{
      salesRepresentativeId: 'SALES-001',
      representativeName: '山田太郎',
      department: '営業部',
    }];

    const stages = [
      { stageId: 'STAGE-001', stageName: '初期接触', sequenceOrder: 1, probability: 10 },
      { stageId: 'STAGE-002', stageName: '提案', sequenceOrder: 2, probability: 50 },
      { stageId: 'STAGE-003', stageName: '商談中', sequenceOrder: 3, probability: 75 },
      { stageId: 'STAGE-004', stageName: '成約', sequenceOrder: 4, probability: 100 },
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
      salesRepresentativeIds: [],
      customerIds: [],
    };

    const input = {
      filterCriteria,
      displayFormat: 'timeline' as const,
      includeAnomalies: true,
      requestedAt: new Date('2024-02-01T10:00:00Z'),
    };

    const result = await generateProcessDataflowDiagram(input);

    expect(result.dataflowNodes).toBeDefined();
    expect(result.dataflowEdges).toBeDefined();

    const timestamps = result.dataflowNodes
      .map(node => new Date(node.createdAt).getTime())
      .filter(t => !isNaN(t));
    const sortedTimestamps = [...timestamps].sort((a, b) => a - b);
    expect(timestamps).toEqual(sortedTimestamps);

    const validEdges = result.dataflowEdges.filter(e => e.isValid);
    expect(validEdges).toContainEqual(
      expect.objectContaining({
        relationshipType: expect.any(String),
        sequenceOrder: expect.any(Number),
      })
    );
  });
});
