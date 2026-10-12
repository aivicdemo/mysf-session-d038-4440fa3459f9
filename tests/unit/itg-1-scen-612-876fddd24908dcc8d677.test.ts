import { generateProcessDataflowDiagram } from '../../src/logic/process-dataflow-mapping';
import * as dataPersistence from '../../src/logic/data-persistence';
import type {
  GenerateProcessDataflowDiagramInput,
  DataflowFilterCriteria,
} from '../../src/logic/process-dataflow-mapping';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-612: displayFormatがtableで指定されたとき、ノードとエッジが表形式に整形されて出力される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should format dataflow nodes and edges as table when displayFormat is table', async () => {
    const filterCriteria: DataflowFilterCriteria = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      salesRepresentativeIds: [],
      customerIds: [],
    };
    const requestedAt = new Date('2024-02-01T10:00:00Z');

    const mockDeals = [
      {
        dealId: 'DEAL001',
        dealName: 'A社新規案件',
        customerId: 'CUST001',
        salesRepresentativeId: 'SR001',
        stageId: 'STAGE_NEGOTIATION',
        dealAmount: 1000000,
        contractedDate: '2024-01-28T00:00:00Z',
        createdAt: '2024-01-10T00:00:00Z',
        updatedAt: '2024-01-28T00:00:00Z',
        description: null,
        lossReason: null,
        invoiceGenerationSLADeadline: null,
        invoiceSLAExceededFlag: false,
        createdBy: 'user1',
      },
      {
        dealId: 'DEAL002',
        dealName: 'B社追加商品',
        customerId: 'CUST002',
        salesRepresentativeId: 'SR001',
        stageId: 'STAGE_PROPOSAL',
        dealAmount: 500000,
        contractedDate: null,
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
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
          dealId: 'DEAL001',
          customerId: 'CUST001',
          invoiceDate: '2024-01-28T00:00:00Z',
          totalAmount: 1000000,
          invoiceStatus: 'ISSUED',
          salesRepresentativeId: 'SR001',
          invoiceNumber: 'INV-2024-001',
          dueDate: '2024-02-28T00:00:00Z',
          taxAmount: 100000,
          untaxedAmount: 900000,
          paidDate: null,
          paidAmount: null,
          remarks: null,
          modificationReason: null,
          reissueCount: 0,
          lastReissuedAt: null,
          amountCalculationVerificationStatus: 'verified',
          referenceIntegrityVerificationStatus: 'verified',
          createdAt: '2024-01-28T00:00:00Z',
          updatedAt: '2024-01-28T00:00:00Z',
          createdBy: 'user1',
        },
        lineItems: [
          {
            lineItemId: 'LI001',
            invoiceId: 'INV001',
            productName: 'ライセンス',
            quantity: 100,
            unitPrice: 10000,
            amount: 1000000,
            dealId: 'DEAL001',
            lineNumber: 1,
            productDescription: null,
            taxRate: 0.1,
            taxAmount: 100000,
            taxIncludedAmount: 1100000,
            remarks: null,
            modificationPreviousQuantity: null,
            modificationPreviousUnitPrice: null,
            modificationPreviousAmount: null,
            createdAt: '2024-01-28T00:00:00Z',
            updatedAt: '2024-01-28T00:00:00Z',
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
          dealId: 'DEAL001',
          customerId: 'CUST001',
          activityType: 'call',
          activityDateTime: '2024-01-10T00:00:00Z',
          salesRepresentativeId: 'SR001',
          activityContent: '初回打ち合わせ',
          nextFollowUpScheduledDate: null,
          estimatedAmount: null,
          contractedFlag: false,
          activityDurationMinutes: 30,
          activityCount: 1,
          activityFrequency: 'once',
          activityResult: 'completed',
          nextAction: null,
          createdAt: '2024-01-10T00:00:00Z',
          updatedAt: '2024-01-10T00:00:00Z',
          createdBy: 'user1',
        },
        deal: null,
        invoices: [],
        fetchedAt: '2024-01-10T00:00:00Z',
      },
      {
        activity: {
          activityId: 'ACT002',
          dealId: 'DEAL001',
          customerId: 'CUST001',
          activityType: 'email',
          activityDateTime: '2024-01-20T00:00:00Z',
          salesRepresentativeId: 'SR001',
          activityContent: '提案書送付',
          nextFollowUpScheduledDate: null,
          estimatedAmount: null,
          contractedFlag: false,
          activityDurationMinutes: 15,
          activityCount: 1,
          activityFrequency: 'once',
          activityResult: 'completed',
          nextAction: null,
          createdAt: '2024-01-20T00:00:00Z',
          updatedAt: '2024-01-20T00:00:00Z',
          createdBy: 'user1',
        },
        deal: null,
        invoices: [],
        fetchedAt: '2024-01-20T00:00:00Z',
      },
      {
        activity: {
          activityId: 'ACT003',
          dealId: 'DEAL002',
          customerId: 'CUST002',
          activityType: 'call',
          activityDateTime: '2024-01-18T00:00:00Z',
          salesRepresentativeId: 'SR001',
          activityContent: 'ヒアリング',
          nextFollowUpScheduledDate: null,
          estimatedAmount: null,
          contractedFlag: false,
          activityDurationMinutes: 45,
          activityCount: 1,
          activityFrequency: 'once',
          activityResult: 'completed',
          nextAction: null,
          createdAt: '2024-01-18T00:00:00Z',
          updatedAt: '2024-01-18T00:00:00Z',
          createdBy: 'user1',
        },
        deal: null,
        invoices: [],
        fetchedAt: '2024-01-18T00:00:00Z',
      },
    ];

    const mockCustomers = [
      {
        customerId: 'CUST001',
        customerName: 'A社',
        industry: '製造業',
        region: '東日本',
        customerNameKana: null,
        customerCategory: null,
        postalCode: null,
        address: null,
        phoneNumber: null,
        emailAddress: null,
        contactPersonName: null,
        paymentTerms: null,
        invoiceAddress: null,
        invoiceEmailAddress: null,
        status: null,
        createdAt: '2023-12-01T00:00:00Z',
        updatedAt: '2023-12-01T00:00:00Z',
        createdBy: 'user1',
        updatedBy: 'user1',
      },
      {
        customerId: 'CUST002',
        customerName: 'B社',
        industry: 'IT',
        region: '関東',
        customerNameKana: null,
        customerCategory: null,
        postalCode: null,
        address: null,
        phoneNumber: null,
        emailAddress: null,
        contactPersonName: null,
        paymentTerms: null,
        invoiceAddress: null,
        invoiceEmailAddress: null,
        status: null,
        createdAt: '2023-12-01T00:00:00Z',
        updatedAt: '2023-12-01T00:00:00Z',
        createdBy: 'user1',
        updatedBy: 'user1',
      },
    ];

    const mockSalesReps = [
      {
        salesRepresentativeId: 'SR001',
        name: '営業太郎',
        department: '営業部',
        emailAddress: 'taro@example.com',
        phoneNumber: null,
        jobTitle: null,
        supervisorId: null,
        status: null,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        createdBy: 'user1',
        updatedBy: null,
      },
    ];

    const mockStages = [
      {
        stageId: 'STAGE_NEGOTIATION',
        stageName: '交渉中',
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
      {
        stageId: 'STAGE_PROPOSAL',
        stageName: '提案中',
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
    ];

    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue({
      deals: mockDeals,
      totalCount: 2,
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
      totalCount: 1,
      fetchedAt: requestedAt.toISOString(),
    });

    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({
      stages: mockStages,
      totalCount: 2,
      fetchedAt: requestedAt.toISOString(),
    });

    const input: GenerateProcessDataflowDiagramInput = {
      filterCriteria,
      displayFormat: 'table',
      includeAnomalies: true,
      requestedAt,
    };

    const result = await generateProcessDataflowDiagram(input);

    // 検証: displayFormat が table の場合、ノードとエッジが表形式で返されることを確認
    expect(result).toBeDefined();
    expect(result.dataflowNodes).toBeDefined();
    expect(Array.isArray(result.dataflowNodes)).toBe(true);

    // テーブル形式の検証：各ノードが複数の列情報を持つことを確認
    result.dataflowNodes.forEach(node => {
      expect(node).toHaveProperty('nodeId');
      expect(node).toHaveProperty('stage');
      expect(node).toHaveProperty('recordId');
      expect(node).toHaveProperty('recordName');
      expect(node).toHaveProperty('status');
      expect(node).toHaveProperty('createdAt');
    });

    // エッジも同様に表形式の列情報を持つことを確認
    expect(result.dataflowEdges).toBeDefined();
    expect(Array.isArray(result.dataflowEdges)).toBe(true);
    result.dataflowEdges.forEach(edge => {
      expect(edge).toHaveProperty('edgeId');
      expect(edge).toHaveProperty('sourceNodeId');
      expect(edge).toHaveProperty('targetNodeId');
      expect(edge).toHaveProperty('relationshipType');
      expect(edge).toHaveProperty('sequenceOrder');
    });

    // summary の統計情報を検証
    expect(result.summary).toBeDefined();
    expect(result.summary).toHaveProperty('totalDeals');
    expect(result.summary.totalDeals).toEqual(2);
    expect(result.summary).toHaveProperty('totalInvoices');

    // generatedAt の検証
    expect(result.generatedAt).toEqual(requestedAt);
  });
});
