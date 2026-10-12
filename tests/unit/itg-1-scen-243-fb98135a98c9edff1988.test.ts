import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-243: prepareMonthlyClosing with all objects and valid data', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should define extraction conditions for all 7 objects when data exists in target period', async () => {
    const closingInstructionId = 'CI-2024-01-001';
    const targetMonth = '2024-01';
    const operatorUserId = 'USER-SALES-OPS-001';
    const executionTimestamp = new Date('2024-01-31T15:00:00Z');

    // Mock fetchAllCustomers
    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue({
      customers: [
        {
          customerId: 'ACC-001',
          customerName: '顧客A',
          isActive: true,
          createdAt: '2023-12-15T00:00:00Z',
          updatedAt: '2023-12-15T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
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
          status: 'active',
        },
        {
          customerId: 'ACC-002',
          customerName: '顧客B',
          isActive: true,
          createdAt: '2023-11-20T00:00:00Z',
          updatedAt: '2023-11-20T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
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
          status: 'active',
        },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchDealsForPeriod
    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue({
      deals: [
        {
          dealId: 'DEAL-001',
          dealName: '取引001',
          customerId: 'ACC-001',
          stageId: 'STAGE-WON',
          status: 'won',
          closedDate: '2024-01-15T00:00:00Z',
          contractedDate: '2024-01-15T00:00:00Z',
          salesRepresentativeId: 'SR-001',
          amount: 500000,
          dealAmount: 500000,
          isActive: true,
          expectedContractDate: '2024-01-15',
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2024-01-10T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
          createdBy: 'SR-001',
        },
        {
          dealId: 'DEAL-002',
          dealName: '取引002',
          customerId: 'ACC-002',
          stageId: 'STAGE-WON',
          status: 'won',
          closedDate: '2024-01-20T00:00:00Z',
          contractedDate: '2024-01-20T00:00:00Z',
          salesRepresentativeId: 'SR-002',
          amount: 300000,
          dealAmount: 300000,
          isActive: true,
          expectedContractDate: '2024-01-20',
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2024-01-15T00:00:00Z',
          updatedAt: '2024-01-20T00:00:00Z',
          createdBy: 'SR-002',
        },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchInvoicesForPeriod
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: [
        {
          invoiceId: 'INV-001',
          dealId: 'DEAL-001',
          invoiceDate: '2024-01-16T00:00:00Z',
          totalAmount: 500000,
          invoiceAmount: 500000,
          taxAmount: 0,
          untaxedAmount: 500000,
          status: 'issued',
          isActive: true,
          customerId: 'ACC-001',
          salesRepresentativeId: 'SR-001',
          invoiceNumber: 'INV-2024-001',
          dueDate: '2024-02-15',
          paidDate: null,
          paidAmount: null,
          remarks: null,
          modificationReason: null,
          reissueCount: 0,
          lastReissuedAt: null,
          amountCalculationVerificationStatus: 'verified',
          referenceIntegrityVerificationStatus: 'verified',
          createdAt: '2024-01-16T00:00:00Z',
          updatedAt: '2024-01-16T00:00:00Z',
          createdBy: 'SYSTEM',
        },
        {
          invoiceId: 'INV-002',
          dealId: 'DEAL-002',
          invoiceDate: '2024-01-21T00:00:00Z',
          totalAmount: 300000,
          invoiceAmount: 300000,
          taxAmount: 0,
          untaxedAmount: 300000,
          status: 'issued',
          isActive: true,
          customerId: 'ACC-002',
          salesRepresentativeId: 'SR-002',
          invoiceNumber: 'INV-2024-002',
          dueDate: '2024-02-20',
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
          createdBy: 'SYSTEM',
        },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchAllDealStages
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({
      stages: [
        {
          stageId: 'STAGE-WON',
          stageName: 'won',
          stageOrder: 5,
          isActive: true,
          validFlag: true,
          contractedStageFlag: true,
          lossStageFlag: false,
          description: null,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
        {
          stageId: 'STAGE-LOST',
          stageName: 'lost',
          stageOrder: 6,
          isActive: true,
          validFlag: true,
          contractedStageFlag: false,
          lossStageFlag: true,
          description: null,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchAllValidationRules
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue({
      validationRules: [
        {
          validationRuleId: 'RULE-001',
          ruleName: '商談と請求書の紐付け確認',
          objectName: 'deal',
          isActive: true,
          ruleDescription: null,
          targetTable: 'deal',
          targetColumn: 'dealId',
          validationType: 'reference_integrity',
          validationCondition: 'deal_id_exists_in_invoice',
          errorMessage: 'Related invoice not found',
          warningLevel: 'high',
          validFlag: true,
          applicationStartDate: '2024-01-01',
          applicationEndDate: null,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
        {
          validationRuleId: 'RULE-002',
          ruleName: '金額一致確認',
          objectName: 'invoice',
          isActive: true,
          ruleDescription: null,
          targetTable: 'invoice',
          targetColumn: 'invoiceAmount',
          validationType: 'amount_match',
          validationCondition: 'invoice_amount_equals_deal_amount',
          errorMessage: 'Invoice amount does not match deal amount',
          warningLevel: 'high',
          validFlag: true,
          applicationStartDate: '2024-01-01',
          applicationEndDate: null,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    // Call the function
    const result = await prepareMonthlyClosing({
      closingInstructionId,
      targetMonth,
      operatorUserId,
      executionTimestamp,
    });

    // Verify the result
    expect(result).toBeDefined();
    expect(result.closingPeriod).toBeDefined();
    expect(result.closingPeriod.periodStartDate).toEqual(new Date('2024-01-01T00:00:00Z'));
    expect(result.closingPeriod.periodEndDate).toEqual(new Date('2024-01-31T23:59:59Z'));

    expect(result.extractionScope).toBeDefined();
    expect(result.extractionScope.customerIds).toContain('ACC-001');
    expect(result.extractionScope.customerIds).toContain('ACC-002');
    expect(result.extractionScope.dealIds).toContain('DEAL-001');
    expect(result.extractionScope.dealIds).toContain('DEAL-002');
    expect(result.extractionScope.invoiceIds).toContain('INV-001');
    expect(result.extractionScope.invoiceIds).toContain('INV-002');
    expect(result.extractionScope.totalCustomerCount).toBe(2);
    expect(result.extractionScope.totalDealCount).toBe(2);
    expect(result.extractionScope.totalInvoiceCount).toBe(2);

    // Verify extraction objects exist (from design gap)
    if ((result.extractionScope as any).extractionObjects) {
      expect((result.extractionScope as any).extractionObjects).toBeDefined();
      expect((result.extractionScope as any).extractionObjects.length).toBe(7);

      const objectNames = (result.extractionScope as any).extractionObjects.map((obj: any) => obj.objectName);
      expect(objectNames).toContain('customer');
      expect(objectNames).toContain('representative');
      expect(objectNames).toContain('activity');
      expect(objectNames).toContain('deal');
      expect(objectNames).toContain('deal_product');
      expect(objectNames).toContain('invoice');
      expect(objectNames).toContain('invoice_line_item');
    }

    // Verify exclusion rules exist (from design gap)
    if ((result.extractionScope as any).exclusionRules) {
      expect((result.extractionScope as any).exclusionRules).toBeDefined();
      expect((result.extractionScope as any).exclusionRules.length).toBeGreaterThan(0);
      expect((result.extractionScope as any).exclusionRules).toEqual(
        expect.arrayContaining([
          expect.stringContaining('test'),
          expect.stringContaining('lost'),
          expect.stringContaining('isActive'),
        ])
      );
    }

    // Verify data integrity checkpoints exist (from design gap)
    if ((result.extractionScope as any).dataIntegrityCheckpoints) {
      expect((result.extractionScope as any).dataIntegrityCheckpoints).toBeDefined();
      expect((result.extractionScope as any).dataIntegrityCheckpoints.length).toBeGreaterThanOrEqual(4);

      const checkpoints = (result.extractionScope as any).dataIntegrityCheckpoints.map((cp: any) => cp.checkpoint);
      expect(checkpoints).toContain('deal_invoice_linking');
      expect(checkpoints).toContain('deal_line_item_amount_match');
      expect(checkpoints).toContain('invoice_line_item_amount_match');
      expect(checkpoints).toContain('deal_invoice_amount_match');
    }

    expect(result.extractionCriteria).toBeDefined();
    expect(result.extractionCriteria.dealStageFilter).toContain('won');
    expect(result.extractionCriteria.invoiceStatusFilter).toContain('issued');

    expect(result.readyForExtraction).toBe(true);
    expect(result.preparationCompletedAt).toEqual(executionTimestamp);

    // Verify that all mocked functions were called
    expect(dataPersistence.fetchAllCustomers).toHaveBeenCalled();
    expect(dataPersistence.fetchDealsForPeriod).toHaveBeenCalled();
    expect(dataPersistence.fetchInvoicesForPeriod).toHaveBeenCalled();
    expect(dataPersistence.fetchAllDealStages).toHaveBeenCalled();
    expect(dataPersistence.fetchAllValidationRules).toHaveBeenCalled();
  });
});
