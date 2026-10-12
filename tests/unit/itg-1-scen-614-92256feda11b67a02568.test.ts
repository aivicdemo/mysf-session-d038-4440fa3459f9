import { generateProcessDataflowDiagram } from '../../src/logic/process-dataflow-mapping';
import * as dataPersistence from '../../src/logic/data-persistence';
import type {
  GenerateProcessDataflowDiagramInput,
  DataflowFilterCriteria,
} from '../../src/logic/process-dataflow-mapping';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-614: includeAnomaliesがfalseで指定されたとき、異常値・未完了案件がanomaly配列から除外される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should exclude anomalies and incomplete deals from result when includeAnomalies is false', async () => {
    const filterCriteria: DataflowFilterCriteria = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      salesRepresentativeIds: [],
      customerIds: [],
    };
    const requestedAt = new Date('2024-02-01T10:00:00Z');

    // D001:完了、D002:未完了、D003:異常値（金額負値）
    const mockDeals = [
      {
        dealId: 'D001',
        dealName: '案件A',
        customerId: 'C001',
        salesRepresentativeId: 'SR001',
        stageId: 'S002',
        dealAmount: 500000,
        contractedDate: '2024-01-20T17:00:00Z',
        createdAt: '2024-01-05T09:00:00Z',
        updatedAt: '2024-01-20T17:00:00Z',
        description: null,
        lossReason: null,
        invoiceGenerationSLADeadline: null,
        invoiceSLAExceededFlag: false,
        createdBy: 'user1',
      },
      {
        dealId: 'D002',
        dealName: '案件B（未完了）',
        customerId: 'C002',
        salesRepresentativeId: 'SR002',
        stageId: 'S001',
        dealAmount: 300000,
        contractedDate: null,
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-10T09:00:00Z',
        description: null,
        lossReason: null,
        invoiceGenerationSLADeadline: null,
        invoiceSLAExceededFlag: false,
        createdBy: 'user1',
      },
      {
        dealId: 'D003',
        dealName: '案件C（異常値）',
        customerId: 'C001',
        salesRepresentativeId: 'SR001',
        stageId: 'S003',
        dealAmount: -50000,
        contractedDate: '2024-01-25T17:00:00Z',
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-25T17:00:00Z',
        description: null,
        lossReason: null,
        invoiceGenerationSLADeadline: null,
        invoiceSLAExceededFlag: false,
        createdBy: 'user1',
      },
    ];

    const mockInvoices = [
      {
        invoice: {
          invoiceId: 'INV001',
          dealId: 'D001',
          customerId: 'C001',
          invoiceDate: '2024-01-20T17:00:00Z',
          totalAmount: 500000,
          invoiceStatus: 'ISSUED',
          salesRepresentativeId: 'SR001',
          invoiceNumber: 'INV-2024-001',
          dueDate: '2024-02-20T00:00:00Z',
          taxAmount: 50000,
          untaxedAmount: 450000,
          paidDate: null,
          paidAmount: null,
          remarks: null,
          modificationReason: null,
          reissueCount: 0,
          lastReissuedAt: null,
          amountCalculationVerificationStatus: 'verified',
          referenceIntegrityVerificationStatus: 'verified',
          createdAt: '2024-01-20T17:00:00Z',
          updatedAt: '2024-01-20T17:00:00Z',
          createdBy: 'user1',
        },
        lineItems: [
          {
            lineItemId: 'LI001',
            invoiceId: 'INV001',
            productName: '商品A',
            quantity: 5,
            unitPrice: 100000,
            amount: 500000,
            dealId: 'D001',
            lineNumber: 1,
            productDescription: null,
            taxRate: 0.1,
            taxAmount: 50000,
            taxIncludedAmount: 550000,
            remarks: null,
            modificationPreviousQuantity: null,
            modificationPreviousUnitPrice: null,
            modificationPreviousAmount: null,
            createdAt: '2024-01-20T17:00:00Z',
            updatedAt: '2024-01-20T17:00:00Z',
            createdBy: 'user1',
            activityId: null,
          },
        ],
      },
    ];

    const mockActivities = [
      {
        activity: {
          activityId: 'ACT001',
          dealId: 'D001',
          customerId: 'C001',
          activityType: 'call',
          activityDateTime: '2024-01-05T14:00:00Z',
          salesRepresentativeId: 'SR001',
          activityContent: '初期接触',
          nextFollowUpScheduledDate: null,
          estimatedAmount: null,
          contractedFlag: false,
          activityDurationMinutes: 30,
          activityCount: 1,
          activityFrequency: 'once',
          activityResult: 'completed',
          nextAction: null,
          createdAt: '2024-01-05T14:30:00Z',
          updatedAt: '2024-01-05T14:30:00Z',
          createdBy: 'user1',
        },
        deal: null,
        invoices: [],
        fetchedAt: '2024-01-05T14:30:00Z',
      },
      {
        activity: {
          activityId: 'ACT002',
          dealId: 'D002',
          customerId: 'C002',
          activityType: 'meeting',
          activityDateTime: '2024-01-10T10:00:00Z',
          salesRepresentativeId: 'SR002',
          activityContent: '打ち合わせ',
          nextFollowUpScheduledDate: null,
          estimatedAmount: null,
          contractedFlag: false,
          activityDurationMinutes: 60,
          activityCount: 1,
          activityFrequency: 'once',
          activityResult: 'completed',
          nextAction: null,
          createdAt: '2024-01-10T11:00:00Z',
          updatedAt: '2024-01-10T11:00:00Z',
          createdBy: 'user1',
        },
        deal: null,
        invoices: [],
        fetchedAt: '2024-01-10T11:00:00Z',
      },
      {
        activity: {
          activityId: 'ACT003',
          dealId: 'D003',
          customerId: 'C001',
          activityType: 'email',
          activityDateTime: '2024-01-15T16:00:00Z',
          salesRepresentativeId: 'SR001',
          activityContent: 'メール送信',
          nextFollowUpScheduledDate: null,
          estimatedAmount: null,
          contractedFlag: false,
          activityDurationMinutes: 5,
          activityCount: 1,
          activityFrequency: 'once',
          activityResult: 'completed',
          nextAction: null,
          createdAt: '2024-01-15T16:30:00Z',
          updatedAt: '2024-01-15T16:30:00Z',
          createdBy: 'user1',
        },
        deal: null,
        invoices: [],
        fetchedAt: '2024-01-15T16:30:00Z',
      },
    ];

    const mockCustomers = [
      {
        customerId: 'C001',
        customerName: '取引先A',
        customerNameKana: null,
        customerCategory: 'corporate',
        postalCode: null,
        address: null,
        phoneNumber: null,
        emailAddress: null,
        contactPersonName: null,
        paymentTerms: null,
        invoiceAddress: null,
        invoiceEmailAddress: null,
        status: null,
        createdAt: '2023-12-01T09:00:00Z',
        updatedAt: '2023-12-01T09:00:00Z',
        createdBy: 'user1',
        updatedBy: 'user1',
      },
      {
        customerId: 'C002',
        customerName: '取引先B',
        customerNameKana: null,
        customerCategory: 'corporate',
        postalCode: null,
        address: null,
        phoneNumber: null,
        emailAddress: null,
        contactPersonName: null,
        paymentTerms: null,
        invoiceAddress: null,
        invoiceEmailAddress: null,
        status: null,
        createdAt: '2023-12-15T09:00:00Z',
        updatedAt: '2023-12-15T09:00:00Z',
        createdBy: 'user1',
        updatedBy: 'user1',
      },
    ];

    const mockSalesReps = [
      {
        salesRepresentativeId: 'SR001',
        name: '営業太郎',
        department: 'Sales Dept',
        emailAddress: 'taro@example.com',
        phoneNumber: null,
        jobTitle: null,
        supervisorId: null,
        status: null,
        createdAt: '2023-11-01T09:00:00Z',
        updatedAt: '2023-11-01T09:00:00Z',
        createdBy: 'user1',
        updatedBy: null,
      },
      {
        salesRepresentativeId: 'SR002',
        name: '営業花子',
        department: 'Sales Dept',
        emailAddress: 'hanako@example.com',
        phoneNumber: null,
        jobTitle: null,
        supervisorId: null,
        status: null,
        createdAt: '2023-11-01T09:00:00Z',
        updatedAt: '2023-11-01T09:00:00Z',
        createdBy: 'user1',
        updatedBy: null,
      },
    ];

    const mockStages = [
      {
        stageId: 'S001',
        stageName: 'Prospecting',
        stageOrder: 1,
        description: null,
        contractedStageFlag: false,
        lossStageFlag: false,
        validFlag: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        createdBy: 'user1',
        updatedBy: 'user1',
      },
      {
        stageId: 'S002',
        stageName: 'Proposal',
        stageOrder: 2,
        description: null,
        contractedStageFlag: false,
        lossStageFlag: false,
        validFlag: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        createdBy: 'user1',
        updatedBy: 'user1',
      },
      {
        stageId: 'S003',
        stageName: 'Negotiation',
        stageOrder: 3,
        description: null,
        contractedStageFlag: false,
        lossStageFlag: false,
        validFlag: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        createdBy: 'user1',
        updatedBy: 'user1',
      },
    ];

    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue({
      deals: mockDeals,
      totalCount: 3,
      fetchedAt: requestedAt.toISOString(),
    });

    (dataPersistence.fetchInvoiceWithLineItems as jest.Mock).mockImplementation(
      ({ invoiceId }: any) => {
        const invoice = mockInvoices.find(inv => inv.invoice.invoiceId === invoiceId);
        return Promise.resolve(invoice);
      }
    );

    (dataPersistence.fetchActivityWithRelatedDealAndInvoice as jest.Mock).mockImplementation(
      ({ activityId }: any) => {
        const activity = mockActivities.find(act => act.activity.activityId === activityId);
        return Promise.resolve(activity);
      }
    );

    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue({
      customers: mockCustomers,
      totalCount: 2,
      fetchedAt: requestedAt.toISOString(),
    });

    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue({
      salesRepresentatives: mockSalesReps,
      totalCount: 2,
      fetchedAt: requestedAt.toISOString(),
    });

    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({
      stages: mockStages,
      totalCount: 3,
      fetchedAt: requestedAt.toISOString(),
    });

    const input: GenerateProcessDataflowDiagramInput = {
      filterCriteria,
      displayFormat: 'diagram',
      includeAnomalies: false,
      requestedAt,
    };

    const result = await generateProcessDataflowDiagram(input);

    // 検証: anomalies が空配列であることを確認
    expect(result.anomalies).toBeDefined();
    expect(Array.isArray(result.anomalies)).toBe(true);
    expect(result.anomalies.length).toBe(0);

    // 検証: dataflowNodes に D001（完了案件）のノードのみが含まれることを確認
    expect(result.dataflowNodes).toBeDefined();
    const d002Nodes = result.dataflowNodes.filter(n => n.recordId === 'D002');
    const d003Nodes = result.dataflowNodes.filter(n => n.recordId === 'D003');
    expect(d002Nodes.length).toBe(0);
    expect(d003Nodes.length).toBe(0);

    // D001 のノードは含まれていることを確認
    const d001Nodes = result.dataflowNodes.filter(n => n.recordId === 'D001');
    expect(d001Nodes.length).toBeGreaterThan(0);

    // 検証: summary に反映されるのは完了案件のみ
    expect(result.summary).toBeDefined();
    expect(result.summary).toHaveProperty('totalDeals');

    // 検証: generatedAt
    expect(result.generatedAt).toEqual(requestedAt);
  });
});
