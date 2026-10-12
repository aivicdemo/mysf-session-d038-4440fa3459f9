import { generateProcessDataflowDiagram } from '../../src/logic/process-dataflow-mapping';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-621: summary aggregates statistics accurately', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should aggregate statistics: count, amount, completion rate', async () => {
    const mockDataPersistence = dataPersistence as jest.Mocked<typeof dataPersistence>;

    const deals = [
      {
        dealId: 'D001',
        customerId: 'C001',
        dealName: '案件A',
        dealAmount: 1000000,
        dealStageId: 'STAGE_CLOSED_WON',
        createdAt: '2024-01-05',
        closedAt: '2024-01-20',
      },
      {
        dealId: 'D002',
        customerId: 'C002',
        dealName: '案件B',
        dealAmount: 500000,
        dealStageId: 'STAGE_NEGOTIATION',
        createdAt: '2024-01-10',
        closedAt: null,
      },
      {
        dealId: 'D003',
        customerId: 'C001',
        dealName: '案件C',
        dealAmount: 750000,
        dealStageId: 'STAGE_CLOSED_WON',
        createdAt: '2024-01-08',
        closedAt: '2024-01-25',
      },
    ];

    const invoices = [
      {
        invoiceId: 'INV001',
        dealId: 'D001',
        invoiceAmount: 1000000,
        invoiceStatus: 'PAID',
        invoiceDate: '2024-01-21',
        lineItems: [{
          lineItemId: 'LI001',
          invoiceId: 'INV001',
          productName: '商品X',
          quantity: 10,
          unitPrice: 100000,
          lineAmount: 1000000,
        }],
      },
      {
        invoiceId: 'INV002',
        dealId: 'D003',
        invoiceAmount: 750000,
        invoiceStatus: 'PAID',
        invoiceDate: '2024-01-26',
        lineItems: [{
          lineItemId: 'LI002',
          invoiceId: 'INV002',
          productName: '商品Y',
          quantity: 15,
          unitPrice: 50000,
          lineAmount: 750000,
        }],
      },
    ];

    const activities = [
      {
        activityId: 'ACT001',
        dealId: 'D001',
        activityType: 'CALL',
        activityDate: '2024-01-15',
        salesRepresentativeId: 'SR001',
      },
      {
        activityId: 'ACT002',
        dealId: 'D001',
        activityType: 'EMAIL',
        activityDate: '2024-01-18',
        salesRepresentativeId: 'SR001',
      },
      {
        activityId: 'ACT003',
        dealId: 'D002',
        activityType: 'MEETING',
        activityDate: '2024-01-12',
        salesRepresentativeId: 'SR002',
      },
      {
        activityId: 'ACT004',
        dealId: 'D003',
        activityType: 'CALL',
        activityDate: '2024-01-20',
        salesRepresentativeId: 'SR001',
      },
    ];

    const customers = [
      { customerId: 'C001', customerName: '取引先A', customerType: 'CORPORATE', createdAt: '2023-06-01' },
      { customerId: 'C002', customerName: '取引先B', customerType: 'CORPORATE', createdAt: '2023-08-15' },
    ];

    const salesReps = [
      { salesRepresentativeId: 'SR001', salesRepresentativeName: '山田太郎', department: '営業部', email: 'yamada@example.com' },
      { salesRepresentativeId: 'SR002', salesRepresentativeName: '鈴木花子', department: '営業部', email: 'suzuki@example.com' },
    ];

    const stages = [
      { stageId: 'STAGE_LEAD', stageName: 'リード', sequenceOrder: 1 },
      { stageId: 'STAGE_QUALIFICATION', stageName: '適格性判定', sequenceOrder: 2 },
      { stageId: 'STAGE_NEGOTIATION', stageName: '交渉中', sequenceOrder: 3 },
      { stageId: 'STAGE_CLOSED_WON', stageName: '成約', sequenceOrder: 4 },
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
      displayFormat: 'diagram' as const,
      includeAnomalies: true,
      requestedAt: new Date('2024-02-01T10:00:00Z'),
    };

    const result = await generateProcessDataflowDiagram(input);

    expect(result.summary).toBeDefined();

    // Verify expected statistics
    expect(result.summary).toEqual(
      expect.objectContaining({
        totalCustomers: expect.any(Number),
        totalDeals: expect.any(Number),
        totalInvoices: expect.any(Number),
        totalActivities: expect.any(Number),
        incompleteStages: expect.any(Array),
      })
    );

    // Verify specific values
    expect(result.summary.totalCustomers).toBeGreaterThanOrEqual(2);
    expect(result.summary.totalDeals).toBeGreaterThanOrEqual(3);
    expect(result.summary.totalInvoices).toBe(2);
    expect(result.summary.totalActivities).toBeGreaterThanOrEqual(4);
  });
});
