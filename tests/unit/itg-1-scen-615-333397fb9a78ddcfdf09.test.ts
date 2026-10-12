import { generateProcessDataflowDiagram } from '../../src/logic/process-dataflow-mapping';
import * as dataPersistence from '../../src/logic/data-persistence';
import type {
  GenerateProcessDataflowDiagramInput,
  DataflowFilterCriteria,
} from '../../src/logic/process-dataflow-mapping';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-615: includeAnomaliesがtrueで指定されたとき、検出された異常値・未完了案件・参照不整合がanomaly配列に含まれる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should include all anomalies in result when includeAnomalies is true', async () => {
    const filterCriteria: DataflowFilterCriteria = {
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2026-01-31T23:59:59Z'),
      salesRepresentativeIds: [],
      customerIds: [],
    };
    const requestedAt = new Date('2026-01-31T12:00:00Z');

    const mockDeals = [
      {
        dealId: 'DEAL-001',
        dealName: 'A社 システム導入案件',
        customerId: 'CUST-001',
        salesRepresentativeId: 'REP-001',
        stageId: 'STAGE-03',
        dealAmount: 5000000,
        contractedDate: null,
        createdAt: '2026-01-05T10:00:00Z',
        updatedAt: '2026-01-05T10:00:00Z',
        description: null,
        lossReason: null,
        invoiceGenerationSLADeadline: null,
        invoiceSLAExceededFlag: false,
        createdBy: 'user1',
      },
      {
        dealId: 'DEAL-002',
        dealName: 'B社 保守契約',
        customerId: 'CUST-002',
        salesRepresentativeId: 'REP-002',
        stageId: 'STAGE-04',
        dealAmount: 1200000,
        contractedDate: '2026-01-20T15:00:00Z',
        createdAt: '2026-01-10T14:30:00Z',
        updatedAt: '2026-01-20T15:00:00Z',
        description: null,
        lossReason: null,
        invoiceGenerationSLADeadline: null,
        invoiceSLAExceededFlag: false,
        createdBy: 'user1',
      },
      {
        dealId: 'DEAL-003',
        dealName: 'C社 案件（請求なし）',
        customerId: 'CUST-003',
        salesRepresentativeId: 'REP-001',
        stageId: 'STAGE-04',
        dealAmount: 800000,
        contractedDate: '2026-01-25T11:00:00Z',
        createdAt: '2026-01-15T09:00:00Z',
        updatedAt: '2026-01-25T11:00:00Z',
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
          invoiceId: 'INV-001',
          dealId: 'DEAL-002',
          customerId: 'CUST-002',
          invoiceDate: '2026-01-20T16:00:00Z',
          totalAmount: 1200000,
          invoiceStatus: 'issued',
          salesRepresentativeId: 'REP-002',
          invoiceNumber: 'INV-2026-001',
          dueDate: '2026-02-20T00:00:00Z',
          taxAmount: 120000,
          untaxedAmount: 1080000,
          paidDate: null,
          paidAmount: null,
          remarks: null,
          modificationReason: null,
          reissueCount: 0,
          lastReissuedAt: null,
          amountCalculationVerificationStatus: 'verified',
          referenceIntegrityVerificationStatus: 'verified',
          createdAt: '2026-01-20T16:00:00Z',
          updatedAt: '2026-01-20T16:00:00Z',
          createdBy: 'user1',
        },
        lineItems: [
          {
            lineItemId: 'LI-001',
            invoiceId: 'INV-001',
            productName: '保守サービス 12ヶ月',
            quantity: 1,
            unitPrice: 1200000,
            amount: 1200000,
            dealId: 'DEAL-002',
            lineNumber: 1,
            productDescription: null,
            taxRate: 0.1,
            taxAmount: 120000,
            taxIncludedAmount: 1320000,
            remarks: null,
            modificationPreviousQuantity: null,
            modificationPreviousUnitPrice: null,
            modificationPreviousAmount: null,
            createdAt: '2026-01-20T16:00:00Z',
            updatedAt: '2026-01-20T16:00:00Z',
            createdBy: 'user1',
            activityId: null,
          },
        ],
      },
      {
        invoice: {
          invoiceId: 'INV-002',
          dealId: 'DEAL-999',
          customerId: 'CUST-005',
          invoiceDate: '2026-01-21T10:00:00Z',
          totalAmount: 500000,
          invoiceStatus: 'issued',
          salesRepresentativeId: 'REP-003',
          invoiceNumber: 'INV-2026-002',
          dueDate: '2026-02-21T00:00:00Z',
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
          createdAt: '2026-01-21T10:00:00Z',
          updatedAt: '2026-01-21T10:00:00Z',
          createdBy: 'user1',
        },
        lineItems: [
          {
            lineItemId: 'LI-002',
            invoiceId: 'INV-002',
            productName: 'コンサルティング',
            quantity: 1,
            unitPrice: 500000,
            amount: 500000,
            dealId: 'DEAL-999',
            lineNumber: 1,
            productDescription: null,
            taxRate: 0.1,
            taxAmount: 50000,
            taxIncludedAmount: 550000,
            remarks: null,
            modificationPreviousQuantity: null,
            modificationPreviousUnitPrice: null,
            modificationPreviousAmount: null,
            createdAt: '2026-01-21T10:00:00Z',
            updatedAt: '2026-01-21T10:00:00Z',
            createdBy: 'user1',
            activityId: null,
          },
        ],
      },
    ];

    const mockActivities = [
      {
        activity: {
          activityId: 'ACT-001',
          dealId: 'DEAL-001',
          customerId: 'CUST-001',
          activityType: 'call',
          activityDateTime: '2026-01-08T10:30:00Z',
          salesRepresentativeId: 'REP-001',
          activityContent: '初回打合せ実施',
          nextFollowUpScheduledDate: null,
          estimatedAmount: null,
          contractedFlag: false,
          activityDurationMinutes: 30,
          activityCount: 1,
          activityFrequency: 'once',
          activityResult: 'completed',
          nextAction: null,
          createdAt: '2026-01-08T10:30:00Z',
          updatedAt: '2026-01-08T10:30:00Z',
          createdBy: 'user1',
        },
        deal: null,
        invoices: [],
        fetchedAt: '2026-01-08T10:30:00Z',
      },
      {
        activity: {
          activityId: 'ACT-002',
          dealId: 'DEAL-002',
          customerId: 'CUST-002',
          activityType: 'email',
          activityDateTime: '2026-01-18T14:00:00Z',
          salesRepresentativeId: 'REP-002',
          activityContent: '契約書確認',
          nextFollowUpScheduledDate: null,
          estimatedAmount: null,
          contractedFlag: false,
          activityDurationMinutes: 15,
          activityCount: 1,
          activityFrequency: 'once',
          activityResult: 'completed',
          nextAction: null,
          createdAt: '2026-01-18T14:00:00Z',
          updatedAt: '2026-01-18T14:00:00Z',
          createdBy: 'user1',
        },
        deal: null,
        invoices: [],
        fetchedAt: '2026-01-18T14:00:00Z',
      },
      {
        activity: {
          activityId: 'ACT-003',
          dealId: null,
          customerId: 'CUST-004',
          activityType: 'meeting',
          activityDateTime: '2026-01-22T13:00:00Z',
          salesRepresentativeId: 'REP-003',
          activityContent: '孤立した活動（商談に紐付かない）',
          nextFollowUpScheduledDate: null,
          estimatedAmount: null,
          contractedFlag: false,
          activityDurationMinutes: 60,
          activityCount: 1,
          activityFrequency: 'once',
          activityResult: 'completed',
          nextAction: null,
          createdAt: '2026-01-22T13:00:00Z',
          updatedAt: '2026-01-22T13:00:00Z',
          createdBy: 'user1',
        },
        deal: null,
        invoices: [],
        fetchedAt: '2026-01-22T13:00:00Z',
      },
    ];

    const mockCustomers = [
      {
        customerId: 'CUST-001',
        customerName: 'A社',
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
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        createdBy: 'user1',
        updatedBy: 'user1',
      },
      {
        customerId: 'CUST-002',
        customerName: 'B社',
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
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        createdBy: 'user1',
        updatedBy: 'user1',
      },
      {
        customerId: 'CUST-003',
        customerName: 'C社',
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
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        createdBy: 'user1',
        updatedBy: 'user1',
      },
      {
        customerId: 'CUST-004',
        customerName: 'D社',
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
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        createdBy: 'user1',
        updatedBy: 'user1',
      },
      {
        customerId: 'CUST-005',
        customerName: 'E社',
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
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        createdBy: 'user1',
        updatedBy: 'user1',
      },
    ];

    const mockSalesReps = [
      {
        salesRepresentativeId: 'REP-001',
        name: '営業 太郎',
        department: 'Sales',
        emailAddress: 'taro@example.com',
        phoneNumber: null,
        jobTitle: null,
        supervisorId: null,
        status: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        createdBy: 'user1',
        updatedBy: null,
      },
      {
        salesRepresentativeId: 'REP-002',
        name: '営業 花子',
        department: 'Sales',
        emailAddress: 'hanako@example.com',
        phoneNumber: null,
        jobTitle: null,
        supervisorId: null,
        status: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        createdBy: 'user1',
        updatedBy: null,
      },
      {
        salesRepresentativeId: 'REP-003',
        name: '営業 次郎',
        department: 'Sales',
        emailAddress: 'jiro@example.com',
        phoneNumber: null,
        jobTitle: null,
        supervisorId: null,
        status: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        createdBy: 'user1',
        updatedBy: null,
      },
    ];

    const mockStages = [
      {
        stageId: 'STAGE-01',
        stageName: '初期接触',
        stageOrder: 1,
        description: null,
        contractedStageFlag: false,
        lossStageFlag: false,
        validFlag: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        createdBy: 'user1',
        updatedBy: 'user1',
      },
      {
        stageId: 'STAGE-02',
        stageName: '提案',
        stageOrder: 2,
        description: null,
        contractedStageFlag: false,
        lossStageFlag: false,
        validFlag: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        createdBy: 'user1',
        updatedBy: 'user1',
      },
      {
        stageId: 'STAGE-03',
        stageName: '商談中',
        stageOrder: 3,
        description: null,
        contractedStageFlag: false,
        lossStageFlag: false,
        validFlag: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        createdBy: 'user1',
        updatedBy: 'user1',
      },
      {
        stageId: 'STAGE-04',
        stageName: '受注',
        stageOrder: 4,
        description: null,
        contractedStageFlag: true,
        lossStageFlag: false,
        validFlag: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
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
      totalCount: 5,
      fetchedAt: requestedAt.toISOString(),
    });

    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue({
      salesRepresentatives: mockSalesReps,
      totalCount: 3,
      fetchedAt: requestedAt.toISOString(),
    });

    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({
      stages: mockStages,
      totalCount: 4,
      fetchedAt: requestedAt.toISOString(),
    });

    const input: GenerateProcessDataflowDiagramInput = {
      filterCriteria,
      displayFormat: 'diagram',
      includeAnomalies: true,
      requestedAt,
    };

    const result = await generateProcessDataflowDiagram(input);

    // 検証: anomalies 配列に異常が含まれている
    expect(result.anomalies).toBeDefined();
    expect(Array.isArray(result.anomalies)).toBe(true);
    expect(result.anomalies.length).toBeGreaterThanOrEqual(3);

    // 異常 1: DEAL-003（請求なし）
    const deal003Anomaly = result.anomalies.find(a => a.affectedNodeIds.includes('DEAL-003'));
    expect(deal003Anomaly).toBeDefined();

    // 異常 2: ACT-003（dealId が null）
    const act003Anomaly = result.anomalies.find(a => a.affectedNodeIds.includes('ACT-003'));
    expect(act003Anomaly).toBeDefined();

    // 異常 3: INV-002（参照先 DEAL-999 が存在しない）
    const inv002Anomaly = result.anomalies.find(a => a.affectedNodeIds.includes('INV-002'));
    expect(inv002Anomaly).toBeDefined();

    // 検証: dataflowNodes に全てのノードが含まれている
    expect(result.dataflowNodes).toBeDefined();
    expect(result.dataflowNodes.length).toBeGreaterThan(0);

    // 顧客ノードの存在確認
    const customerNodes = result.dataflowNodes.filter(n => n.stage === 'customer');
    expect(customerNodes.length).toBeGreaterThanOrEqual(5);

    // 営業担当者ノードの存在確認
    const repNodes = result.dataflowNodes.filter(n => n.stage === 'representative');
    expect(repNodes.length).toBeGreaterThanOrEqual(3);

    // 活動ノードの存在確認
    const activityNodes = result.dataflowNodes.filter(n => n.stage === 'activity');
    expect(activityNodes.length).toBeGreaterThanOrEqual(3);

    // 商談ノードの存在確認
    const dealNodes = result.dataflowNodes.filter(n => n.stage === 'deal');
    expect(dealNodes.length).toBeGreaterThanOrEqual(3);

    // 請求ノードの存在確認
    const invoiceNodes = result.dataflowNodes.filter(n => n.stage === 'invoice');
    expect(invoiceNodes.length).toBeGreaterThanOrEqual(2);

    // 検証: generatedAt
    expect(result.generatedAt).toBeDefined();
    expect(result.generatedAt.getTime()).toBeGreaterThanOrEqual(requestedAt.getTime());
  });
});
