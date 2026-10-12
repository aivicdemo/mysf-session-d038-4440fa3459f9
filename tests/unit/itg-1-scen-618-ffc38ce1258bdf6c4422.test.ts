import { generateProcessDataflowDiagram } from '../../src/logic/process-dataflow-mapping';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-618: generatedAt records current time and matches requestedAt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set generatedAt equal to requestedAt', async () => {
    const mockDataPersistence = dataPersistence as jest.Mocked<typeof dataPersistence>;

    const deals = [{
      dealId: 'DEAL-001',
      customerId: 'CUST-001',
      salesRepresentativeId: 'REP-001',
      stageName: '商談確定',
      amount: 500000,
      createdAt: '2026-10-02T09:15:00Z',
      closedAt: '2026-10-05T14:30:00Z',
    }];

    const invoices = [{
      invoiceId: 'INV-001',
      dealId: 'DEAL-001',
      invoiceNumber: 'INV-2026-10-001',
      amount: 500000,
      status: 'issued',
      issuedAt: '2026-10-05T15:00:00Z',
      lineItems: [{
        lineItemId: 'LINE-001',
        invoiceId: 'INV-001',
        description: '商品A',
        quantity: 1,
        unitPrice: 500000,
        amount: 500000,
      }],
    }];

    const activities = [{
      activityId: 'ACT-001',
      dealId: 'DEAL-001',
      salesRepresentativeId: 'REP-001',
      activityType: 'meeting',
      subject: '顧客訪問',
      activityDate: '2026-10-03T10:00:00Z',
      completedAt: '2026-10-03T11:30:00Z',
    }];

    const customers = [{
      customerId: 'CUST-001',
      customerName: '顧客A株式会社',
      industry: '製造業',
      createdAt: '2026-01-15T08:00:00Z',
    }];

    const salesReps = [{
      salesRepresentativeId: 'REP-001',
      representativeName: '営業太郎',
      department: '営業部',
      createdAt: '2026-01-01T00:00:00Z',
    }];

    const stages = [
      { stageId: 'STAGE-001', stageName: '見込客', sequenceNumber: 1, isClosedWon: false },
      { stageId: 'STAGE-002', stageName: '商談確定', sequenceNumber: 5, isClosedWon: true },
    ];

    mockDataPersistence.fetchDealsForPeriod = jest.fn().mockResolvedValue(deals);
    mockDataPersistence.fetchInvoiceWithLineItems = jest.fn().mockResolvedValue(invoices);
    mockDataPersistence.fetchActivityWithRelatedDealAndInvoice = jest.fn().mockResolvedValue(activities);
    mockDataPersistence.fetchAllCustomers = jest.fn().mockResolvedValue(customers);
    mockDataPersistence.fetchAllSalesRepresentatives = jest.fn().mockResolvedValue(salesReps);
    mockDataPersistence.fetchAllDealStages = jest.fn().mockResolvedValue(stages);

    const requestedAtTime = new Date('2026-10-07T10:30:45.123Z');
    const filterCriteria = {
      startDate: new Date('2026-10-01T00:00:00Z'),
      endDate: new Date('2026-10-07T23:59:59Z'),
    };

    const input = {
      filterCriteria,
      displayFormat: 'diagram' as const,
      includeAnomalies: true,
      requestedAt: requestedAtTime,
    };

    const result = await generateProcessDataflowDiagram(input);

    expect(result.generatedAt).toEqual(requestedAtTime);
    expect(result.generatedAt.toISOString()).toBe('2026-10-07T10:30:45.123Z');
    expect(result.dataflowNodes).toBeDefined();
    expect(result.dataflowEdges).toBeDefined();
    expect(result.anomalies).toBeDefined();
    expect(result.summary).toBeDefined();
  });
});
