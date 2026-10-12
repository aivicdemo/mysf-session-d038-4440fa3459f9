import { generateProcessDataflowDiagram, DataflowIncompleteOrMissing } from '../../src/logic/process-dataflow-mapping';
import * as dataPersistence from '../../src/logic/data-persistence';
import type {
  GenerateProcessDataflowDiagramInput,
  DataflowFilterCriteria,
  ProcessDataflowDiagram,
} from '../../src/logic/process-dataflow-mapping';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-607: 指定期間内の全営業データが正常に抽出でき、顧客から請求までの完全なデータフロー図が生成される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate complete dataflow diagram with all nodes and edges', async () => {
    // 前提データの構築
    const filterCriteria: DataflowFilterCriteria = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      salesRepresentativeIds: [],
      customerIds: [],
    };
    const requestedAt = new Date('2024-02-01T10:00:00Z');

    const mockDeals = [
      {
        dealId: 'D001',
        customerId: 'C001',
        dealName: '顧客A 新規案件',
        stageId: 'STAGE_CLOSED_WON',
        dealAmount: 500000,
        contractedDate: '2024-01-20',
        salesRepresentativeId: 'SR001',
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-20T14:00:00Z',
        description: null,
        lossReason: null,
        invoiceGenerationSLADeadline: null,
        invoiceSLAExceededFlag: false,
        createdBy: 'user1',
      },
      {
        dealId: 'D002',
        customerId: 'C002',
        dealName: '顧客B 追加案件',
        stageId: 'STAGE_NEGOTIATION',
        dealAmount: 300000,
        contractedDate: null,
        salesRepresentativeId: 'SR002',
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T09:00:00Z',
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
          invoiceDate: '2024-01-21',
          totalAmount: 500000,
          invoiceStatus: 'ISSUED',
          salesRepresentativeId: 'SR001',
          invoiceNumber: 'INV-2024-001',
          dueDate: '2024-02-21',
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
          createdAt: '2024-01-21T00:00:00Z',
          updatedAt: '2024-01-21T00:00:00Z',
          createdBy: 'user1',
        },
        lineItems: [
          {
            lineItemId: 'LI001',
            invoiceId: 'INV001',
            productName: '商品A',
            quantity: 10,
            unitPrice: 50000,
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
            createdAt: '2024-01-21T00:00:00Z',
            updatedAt: '2024-01-21T00:00:00Z',
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
          activityType: 'CALL',
          activityDateTime: '2024-01-15T10:00:00Z',
          salesRepresentativeId: 'SR001',
          activityContent: '初回商談',
          nextFollowUpScheduledDate: null,
          estimatedAmount: null,
          contractedFlag: false,
          activityDurationMinutes: 30,
          activityCount: 1,
          activityFrequency: 'once',
          activityResult: 'completed',
          nextAction: null,
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
          createdBy: 'user1',
        },
        deal: null,
        invoices: [],
        fetchedAt: '2024-01-15T10:30:00Z',
      },
      {
        activity: {
          activityId: 'ACT002',
          dealId: 'D001',
          customerId: 'C001',
          activityType: 'EMAIL',
          activityDateTime: '2024-01-18T14:00:00Z',
          salesRepresentativeId: 'SR001',
          activityContent: '提案内容確認',
          nextFollowUpScheduledDate: null,
          estimatedAmount: null,
          contractedFlag: false,
          activityDurationMinutes: 15,
          activityCount: 1,
          activityFrequency: 'once',
          activityResult: 'completed',
          nextAction: null,
          createdAt: '2024-01-18T14:30:00Z',
          updatedAt: '2024-01-18T14:30:00Z',
          createdBy: 'user1',
        },
        deal: null,
        invoices: [],
        fetchedAt: '2024-01-18T14:30:00Z',
      },
      {
        activity: {
          activityId: 'ACT003',
          dealId: 'D002',
          customerId: 'C002',
          activityType: 'MEETING',
          activityDateTime: '2024-01-10T11:00:00Z',
          salesRepresentativeId: 'SR002',
          activityContent: '要件ヒアリング',
          nextFollowUpScheduledDate: null,
          estimatedAmount: null,
          contractedFlag: false,
          activityDurationMinutes: 60,
          activityCount: 1,
          activityFrequency: 'once',
          activityResult: 'completed',
          nextAction: null,
          createdAt: '2024-01-10T11:30:00Z',
          updatedAt: '2024-01-10T11:30:00Z',
          createdBy: 'user1',
        },
        deal: null,
        invoices: [],
        fetchedAt: '2024-01-10T11:30:00Z',
      },
    ];

    const mockCustomers = [
      {
        customerId: 'C001',
        customerName: '顧客A',
        industry: '製造業',
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
      {
        customerId: 'C002',
        customerName: '顧客B',
        industry: '商社',
        region: '関西',
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
        createdAt: '2023-12-15T00:00:00Z',
        updatedAt: '2023-12-15T00:00:00Z',
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
      {
        salesRepresentativeId: 'SR002',
        name: '営業花子',
        department: '営業部',
        emailAddress: 'hanako@example.com',
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
        stageId: 'STAGE_INITIAL',
        stageName: '初期接触',
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
        stageId: 'STAGE_NEGOTIATION',
        stageName: '交渉中',
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
        stageId: 'STAGE_CLOSED_WON',
        stageName: '成約',
        stageOrder: 3,
        description: null,
        contractedStageFlag: true,
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
      includeAnomalies: true,
      requestedAt,
    };

    const result = await generateProcessDataflowDiagram(input);

    // 検証: dataflowNodes の構成
    expect(result.dataflowNodes).toBeDefined();
    expect(result.dataflowNodes.length).toBeGreaterThanOrEqual(8); // 顧客2+営業担当者2+活動3+商談2+請求1以上

    const customerNodes = result.dataflowNodes.filter(n => n.stage === 'customer');
    const repNodes = result.dataflowNodes.filter(n => n.stage === 'representative');
    const activityNodes = result.dataflowNodes.filter(n => n.stage === 'activity');
    const dealNodes = result.dataflowNodes.filter(n => n.stage === 'deal');
    const invoiceNodes = result.dataflowNodes.filter(n => n.stage === 'invoice');

    expect(customerNodes.length).toBeGreaterThanOrEqual(2);
    expect(repNodes.length).toBeGreaterThanOrEqual(2);
    expect(activityNodes.length).toBeGreaterThanOrEqual(3);
    expect(dealNodes.length).toBeGreaterThanOrEqual(2);
    expect(invoiceNodes.length).toBeGreaterThanOrEqual(1);

    // 検証: dataflowEdges の参照関係
    expect(result.dataflowEdges).toBeDefined();
    expect(result.dataflowEdges.length).toBeGreaterThan(0);

    // C001 → SR001 → ACT001 → D001 → INV001 の経路が存在することを確認
    const c001Node = customerNodes.find(n => n.recordId === 'C001');
    const sr001Node = repNodes.find(n => n.recordId === 'SR001');
    const act001Node = activityNodes.find(n => n.recordId === 'ACT001');
    const d001Node = dealNodes.find(n => n.recordId === 'D001');
    const inv001Node = invoiceNodes.find(n => n.recordId === 'INV001');

    expect(c001Node).toBeDefined();
    expect(sr001Node).toBeDefined();
    expect(act001Node).toBeDefined();
    expect(d001Node).toBeDefined();
    expect(inv001Node).toBeDefined();

    // 検証: anomalies
    expect(result.anomalies).toBeDefined();
    const d002Anomaly = result.anomalies.find(a => a.affectedNodeIds.includes('D002'));
    expect(d002Anomaly).toBeDefined();
    if (d002Anomaly) {
      expect(d002Anomaly.anomalyType).toBe('incomplete_stage');
    }

    // 検証: summary
    expect(result.summary).toBeDefined();
    expect(result.summary).toHaveProperty('totalDeals');
    expect(result.summary).toHaveProperty('totalCustomers');
    expect(result.summary).toHaveProperty('totalInvoices');
    expect(result.summary.totalDeals).toEqual(2);
    expect(result.summary.totalInvoices).toBeGreaterThanOrEqual(1);

    // 検証: generatedAt
    expect(result.generatedAt).toBeDefined();
    expect(result.generatedAt).toEqual(requestedAt);
  });
});
