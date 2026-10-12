import { generateProcessDataflowDiagram, DataflowIncompleteOrMissing } from '../../src/logic/process-dataflow-mapping';
import * as dataPersistence from '../../src/logic/data-persistence';
import type {
  GenerateProcessDataflowDiagramInput,
  DataflowFilterCriteria,
  ProcessDataflowDiagram,
} from '../../src/logic/process-dataflow-mapping';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-609: 取引先・責任者・活動・商談・請求のいずれかのステージでデータが欠落している場合、DataflowIncompleteOrMissingエラーが発生', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataflowIncompleteOrMissing error when activity dealId is null', async () => {
    const filterCriteria: DataflowFilterCriteria = {
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-31T23:59:59Z'),
      salesRepresentativeIds: [],
      customerIds: [],
    };
    const requestedAt = new Date('2024-02-01T10:00:00Z');

    const mockDeals = [
      {
        dealId: 'DEAL-001',
        dealName: '案件A',
        customerId: 'CUST-001',
        salesRepresentativeId: 'SR-001',
        stageId: 'STAGE-003',
        dealAmount: 100000,
        contractedDate: '2024-01-20T14:00:00Z',
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-20T14:00:00Z',
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
          dealId: 'DEAL-001',
          customerId: 'CUST-001',
          invoiceDate: '2024-01-25T00:00:00Z',
          totalAmount: 100000,
          invoiceStatus: 'ISSUED',
          salesRepresentativeId: 'SR-001',
          invoiceNumber: 'INV-2024-001',
          dueDate: '2024-02-25T00:00:00Z',
          taxAmount: 10000,
          untaxedAmount: 90000,
          paidDate: null,
          paidAmount: null,
          remarks: null,
          modificationReason: null,
          reissueCount: 0,
          lastReissuedAt: null,
          amountCalculationVerificationStatus: 'verified',
          referenceIntegrityVerificationStatus: 'verified',
          createdAt: '2024-01-25T11:00:00Z',
          updatedAt: '2024-01-25T11:00:00Z',
          createdBy: 'user1',
        },
        lineItems: [],
      },
    ];

    // dealId が null の活動（参照破損）
    const mockActivities = [
      {
        activity: {
          activityId: 'ACT-001',
          dealId: null,
          customerId: 'CUST-001',
          activityType: '電話',
          activityDateTime: '2024-01-15T10:00:00Z',
          salesRepresentativeId: 'SR-001',
          activityContent: 'テスト',
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
    ];

    const mockCustomers = [
      {
        customerId: 'CUST-001',
        customerName: '顧客A',
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
        salesRepresentativeId: 'SR-001',
        name: '営業担当者A',
        department: 'Sales',
        emailAddress: 'rep@example.com',
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
        stageId: 'STAGE-001',
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
        stageId: 'STAGE-002',
        stageName: '提案',
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
        stageId: 'STAGE-003',
        stageName: '受注',
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
      totalCount: 1,
      fetchedAt: requestedAt.toISOString(),
    });

    (dataPersistence.fetchInvoiceWithLineItems as jest.Mock).mockResolvedValue(mockInvoices[0]);

    (dataPersistence.fetchActivityWithRelatedDealAndInvoice as jest.Mock).mockResolvedValue(mockActivities[0]);

    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue({
      customers: mockCustomers,
      totalCount: 1,
      fetchedAt: requestedAt.toISOString(),
    });

    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue({
      salesRepresentatives: mockSalesReps,
      totalCount: 1,
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

    await expect(generateProcessDataflowDiagram(input)).rejects.toThrow(DataflowIncompleteOrMissing);

    try {
      await generateProcessDataflowDiagram(input);
    } catch (error) {
      if (error instanceof DataflowIncompleteOrMissing) {
        expect(error.message).toContain('営業プロセスの一部ステージにデータが不足しています');
      }
    }
  });
});
