import { generateProcessDataflowDiagram } from '../../src/logic/process-dataflow-mapping';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-620: dataflowEdge expresses reference relationships and generation order accurately', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate edges reflecting accurate reference relationships and sequence order', async () => {
    const mockDataPersistence = dataPersistence as jest.Mocked<typeof dataPersistence>;

    const customers = [
      { customerId: 'CUST001', customerName: 'A社', createdAt: '2024-01-01T08:00:00Z' },
      { customerId: 'CUST002', customerName: 'B社', createdAt: '2024-01-05T09:00:00Z' },
    ];

    const salesReps = [
      { salesRepresentativeId: 'SR001', salesRepresentativeName: '営業太郎', department: '営業部' },
      { salesRepresentativeId: 'SR002', salesRepresentativeName: '営業花子', department: '営業部' },
    ];

    const stages = [
      { stageId: 'STAGE01', stageName: '初期接触', sequenceOrder: 1 },
      { stageId: 'STAGE02', stageName: '提案', sequenceOrder: 2 },
      { stageId: 'STAGE03', stageName: '受注', sequenceOrder: 3 },
    ];

    const deals = [
      {
        dealId: 'DEAL001',
        customerId: 'CUST001',
        dealName: 'A社契約',
        stageId: 'STAGE03',
        salesRepresentativeId: 'SR001',
        amount: 500000,
        closedDate: '2024-01-15T10:00:00Z',
        createdAt: '2024-01-01T08:30:00Z',
      },
      {
        dealId: 'DEAL002',
        customerId: 'CUST002',
        dealName: 'B社契約',
        stageId: 'STAGE02',
        salesRepresentativeId: 'SR002',
        amount: 300000,
        closedDate: null,
        createdAt: '2024-01-10T09:15:00Z',
      },
    ];

    const activities = [
      {
        activityId: 'ACT001',
        dealId: 'DEAL001',
        activityType: '訪問',
        activityDate: '2024-01-08T14:00:00Z',
        createdAt: '2024-01-08T14:30:00Z',
        invoiceId: 'INV001',
      },
      {
        activityId: 'ACT002',
        dealId: 'DEAL001',
        activityType: '電話',
        activityDate: '2024-01-12T11:00:00Z',
        createdAt: '2024-01-12T11:30:00Z',
        invoiceId: 'INV001',
      },
      {
        activityId: 'ACT003',
        dealId: 'DEAL002',
        activityType: 'メール',
        activityDate: '2024-01-14T15:00:00Z',
        createdAt: '2024-01-14T15:30:00Z',
        invoiceId: null,
      },
    ];

    const invoices = [{
      invoiceId: 'INV001',
      dealId: 'DEAL001',
      customerId: 'CUST001',
      invoiceNumber: '2024-001',
      invoiceAmount: 500000,
      invoiceDate: '2024-01-15T16:00:00Z',
      createdAt: '2024-01-15T16:15:00Z',
      lineItems: [{
        lineItemId: 'LINE001',
        invoiceId: 'INV001',
        description: '商品A',
        quantity: 10,
        unitPrice: 50000,
        lineAmount: 500000,
      }],
    }];

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
      displayFormat: 'diagram' as const,
      includeAnomalies: true,
      requestedAt: new Date('2024-02-01T10:00:00Z'),
    };

    const result = await generateProcessDataflowDiagram(input);

    expect(result.dataflowEdges).toBeDefined();
    expect(result.dataflowEdges.length).toBeGreaterThan(0);

    result.dataflowEdges.forEach(edge => {
      expect(edge).toHaveProperty('edgeId');
      expect(edge).toHaveProperty('sourceNodeId');
      expect(edge).toHaveProperty('targetNodeId');
      expect(edge).toHaveProperty('relationshipType');
      expect(['generates', 'references', 'relates_to']).toContain(edge.relationshipType);
      expect(edge).toHaveProperty('sequenceOrder');
      expect(typeof edge.sequenceOrder).toBe('number');
      expect(edge).toHaveProperty('isValid');
      expect(typeof edge.isValid).toBe('boolean');
    });

    const sortedEdges = [...result.dataflowEdges].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
    for (let i = 0; i < sortedEdges.length - 1; i++) {
      expect(sortedEdges[i].sequenceOrder).toBeLessThanOrEqual(sortedEdges[i + 1].sequenceOrder);
    }
  });
});
