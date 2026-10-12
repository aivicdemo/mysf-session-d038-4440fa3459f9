import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import type { PrepareMonthlyClosingOutput } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1564: 抽出スコープ確定後、対象期間内の商談が金額・ステージ・成約状態とともに抽出される', () => {
  const mockDataPersistence = dataPersistence as jest.Mocked<typeof dataPersistence>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('2025年1月の商談・請求が期間内で抽出スコープに含まれ、出力に正しく反映される', async () => {
    // 前提条件のセットアップ
    const input = {
      closingInstructionId: 'INSTR-20250101-001',
      targetMonth: '2025-01',
      operatorUserId: 'USER-SALES-OPS-001',
      executionTimestamp: new Date('2025-01-15T10:30:00Z'),
    };

    // モック依存関数の設定
    mockDataPersistence.fetchAllCustomers.mockResolvedValue({
      customers: [
        {
          customerId: 'CUST-001',
          customerName: 'ABC商社',
          customerNameKana: null,
          customerCategory: 'standard',
          postalCode: null,
          address: null,
          phoneNumber: null,
          emailAddress: null,
          contactPersonName: null,
          paymentTerms: null,
          invoiceAddress: null,
          invoiceEmailAddress: null,
          status: 'active',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
        {
          customerId: 'CUST-002',
          customerName: 'XYZ製造',
          customerNameKana: null,
          customerCategory: 'standard',
          postalCode: null,
          address: null,
          phoneNumber: null,
          emailAddress: null,
          contactPersonName: null,
          paymentTerms: null,
          invoiceAddress: null,
          invoiceEmailAddress: null,
          status: 'active',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    mockDataPersistence.fetchDealsForPeriod.mockResolvedValue({
      deals: [
        {
          dealId: 'DEAL-001',
          dealName: 'システム構築プロジェクト',
          customerId: 'CUST-001',
          dealAmount: 5000000,
          stageId: 'STAGE-003',
          salesRepresentativeId: 'SR-001',
          expectedContractDate: '2025-01-05',
          contractedDate: '2025-01-05',
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2025-01-05',
          updatedAt: '2025-01-05',
          createdBy: 'USER-001',
        },
        {
          dealId: 'DEAL-002',
          dealName: '保守契約更新',
          customerId: 'CUST-002',
          dealAmount: 1200000,
          stageId: 'STAGE-003',
          salesRepresentativeId: 'SR-002',
          expectedContractDate: '2025-01-08',
          contractedDate: '2025-01-08',
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2025-01-08',
          updatedAt: '2025-01-08',
          createdBy: 'USER-001',
        },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    mockDataPersistence.fetchInvoicesForPeriod.mockResolvedValue({
      invoices: [
        {
          invoiceId: 'INV-2025-001',
          dealId: 'DEAL-001',
          customerId: 'CUST-001',
          salesRepresentativeId: 'SR-001',
          invoiceNumber: 'INV-2025-001',
          invoiceDate: '2025-01-10',
          dueDate: '2025-02-10',
          invoiceAmount: 5000000,
          taxAmount: 500000,
          untaxedAmount: 4500000,
          invoiceStatus: 'issued',
          paidDate: null,
          paidAmount: null,
          remarks: null,
          modificationReason: null,
          reissueCount: 0,
          lastReissuedAt: null,
          amountCalculationVerificationStatus: 'verified',
          referenceIntegrityVerificationStatus: 'verified',
          createdAt: '2025-01-10',
          updatedAt: '2025-01-10',
          createdBy: 'USER-001',
        },
        {
          invoiceId: 'INV-2025-002',
          dealId: 'DEAL-002',
          customerId: 'CUST-002',
          salesRepresentativeId: 'SR-002',
          invoiceNumber: 'INV-2025-002',
          invoiceDate: '2025-01-12',
          dueDate: '2025-02-12',
          invoiceAmount: 1200000,
          taxAmount: 120000,
          untaxedAmount: 1080000,
          invoiceStatus: 'issued',
          paidDate: null,
          paidAmount: null,
          remarks: null,
          modificationReason: null,
          reissueCount: 0,
          lastReissuedAt: null,
          amountCalculationVerificationStatus: 'verified',
          referenceIntegrityVerificationStatus: 'verified',
          createdAt: '2025-01-12',
          updatedAt: '2025-01-12',
          createdBy: 'USER-001',
        },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    mockDataPersistence.fetchAllDealStages.mockResolvedValue({
      stages: [
        {
          stageId: 'STAGE-001',
          stageName: '初期接触',
          stageOrder: 1,
          description: null,
          contractedStageFlag: false,
          lossStageFlag: false,
          validFlag: true,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
        {
          stageId: 'STAGE-002',
          stageName: '提案',
          stageOrder: 2,
          description: null,
          contractedStageFlag: false,
          lossStageFlag: false,
          validFlag: true,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
        {
          stageId: 'STAGE-003',
          stageName: '成約済み',
          stageOrder: 3,
          description: null,
          contractedStageFlag: true,
          lossStageFlag: false,
          validFlag: true,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
      ],
      totalCount: 3,
      fetchedAt: new Date().toISOString(),
    });

    mockDataPersistence.fetchAllValidationRules.mockResolvedValue({
      validationRules: [
        {
          validationRuleId: 'RULE-001',
          ruleName: '商談金額必須',
          ruleDescription: null,
          targetTable: 'deal',
          targetColumn: 'dealAmount',
          validationType: 'field_required',
          validationCondition: 'dealAmount > 0',
          errorMessage: '商談金額は必須です',
          warningLevel: 'error',
          validFlag: true,
          applicationStartDate: '2024-01-01',
          applicationEndDate: null,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
        {
          validationRuleId: 'RULE-002',
          ruleName: '請求日と成約日の一致確認',
          ruleDescription: null,
          targetTable: 'deal_invoice',
          targetColumn: 'invoiceDate',
          validationType: 'data_integrity',
          validationCondition: 'invoiceDate >= contractedDate',
          errorMessage: '請求日と成約日の整合性が必要です',
          warningLevel: 'error',
          validFlag: true,
          applicationStartDate: '2024-01-01',
          applicationEndDate: null,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    // テスト実行
    const result = await prepareMonthlyClosing(input);

    // 期待結果の検証
    expect(result).toBeDefined();
    expect(result.readyForExtraction).toBe(true);
    expect(result.preparationCompletedAt).toBeDefined();

    // 対象期間の検証
    expect(result.closingPeriod.targetMonth).toBe('2025-01');
    expect(result.closingPeriod.periodStartDate.toISOString()).toMatch(/2025-01-01/);
    expect(result.closingPeriod.periodEndDate.toISOString()).toMatch(/2025-01-31/);

    // 抽出スコープの検証
    expect(result.extractionScope).toBeDefined();
    expect(result.extractionScope.customerIds).toContain('CUST-001');
    expect(result.extractionScope.customerIds).toContain('CUST-002');
    expect(result.extractionScope.dealIds).toContain('DEAL-001');
    expect(result.extractionScope.dealIds).toContain('DEAL-002');
    expect(result.extractionScope.invoiceIds).toContain('INV-2025-001');
    expect(result.extractionScope.invoiceIds).toContain('INV-2025-002');

    // 抽出スコープの件数検証
    expect(result.extractionScope.totalCustomerCount).toBe(2);
    expect(result.extractionScope.totalDealCount).toBe(2);
    expect(result.extractionScope.totalInvoiceCount).toBe(2);

    // 抽出条件の検証
    expect(result.extractionCriteria).toBeDefined();
    expect(result.extractionCriteria.dealStageFilter).toContain('成約済み');
    expect(result.extractionCriteria.invoiceStatusFilter).toContain('issued');
    expect(result.extractionCriteria.validationRulesToApply).toBeDefined();
    expect(result.extractionCriteria.validationRulesToApply.length).toBeGreaterThan(0);

    // モック関数が呼び出されたことを確認
    expect(mockDataPersistence.fetchAllCustomers).toHaveBeenCalled();
    expect(mockDataPersistence.fetchDealsForPeriod).toHaveBeenCalled();
    expect(mockDataPersistence.fetchInvoicesForPeriod).toHaveBeenCalled();
    expect(mockDataPersistence.fetchAllDealStages).toHaveBeenCalled();
    expect(mockDataPersistence.fetchAllValidationRules).toHaveBeenCalled();
  });
});
