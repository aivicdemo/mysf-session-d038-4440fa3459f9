import {
  prepareMonthlyClosing,
  ExtractionCriteriaDefinitionFailed,
  type PrepareMonthlyClosingInput,
} from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';
import type {
  FetchAllCustomersOutput,
  FetchDealsForPeriodOutput,
  FetchInvoicesForPeriodOutput,
  FetchAllDealStagesOutput,
  FetchAllValidationRulesOutput,
} from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1576: 請求明細行アイテム空でエラー発生し検証中断', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('請求明細行アイテムが空の場合、ExtractionCriteriaDefinitionFailedエラーをスロー', async () => {
    // 前提データの準備
    const mockAllCustomersOutput: FetchAllCustomersOutput = {
      customers: [
        {
          customerId: 'CUST-001',
          customerName: 'テスト取引先A',
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
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          createdBy: 'ADMIN',
          updatedBy: 'ADMIN',
        },
      ],
      totalCount: 1,
      fetchedAt: '2024-01-31T00:00:00Z',
    };

    const mockDealsForPeriodOutput: FetchDealsForPeriodOutput = {
      deals: [],
      totalCount: 0,
      fetchedAt: '2024-01-31T00:00:00Z',
    };

    const mockInvoicesForPeriodOutput: FetchInvoicesForPeriodOutput = {
      invoices: [
        {
          invoiceId: 'INV-2024-001',
          dealId: 'DEAL-001',
          customerId: 'CUST-001',
          salesRepresentativeId: 'REP-001',
          invoiceNumber: 'INV-001',
          invoiceDate: '2024-01-15',
          dueDate: '2024-02-15',
          invoiceAmount: 100000,
          taxAmount: 10000,
          untaxedAmount: 90000,
          invoiceStatus: 'issued',
          paidDate: null,
          paidAmount: null,
          remarks: null,
          modificationReason: null,
          reissueCount: 0,
          lastReissuedAt: null,
          amountCalculationVerificationStatus: 'verified',
          referenceIntegrityVerificationStatus: 'verified',
          createdAt: '2024-01-15',
          updatedAt: '2024-01-15',
          createdBy: 'SYSTEM',
        },
      ],
      totalCount: 1,
      fetchedAt: '2024-01-31T00:00:00Z',
    };

    const mockAllDealStagesOutput: FetchAllDealStagesOutput = {
      stages: [
        {
          stageId: 'STAGE-001',
          stageName: '成約済み',
          stageOrder: 1,
          description: null,
          contractedStageFlag: true,
          lossStageFlag: false,
          validFlag: true,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          createdBy: 'ADMIN',
          updatedBy: 'ADMIN',
        },
      ],
      totalCount: 1,
      fetchedAt: '2024-01-31T00:00:00Z',
    };

    const mockAllValidationRulesOutput: FetchAllValidationRulesOutput = {
      validationRules: [
        {
          validationRuleId: 'RULE-001',
          ruleName: '請求明細と商談の紐付け検証',
          ruleDescription: null,
          targetTable: 'invoices',
          targetColumn: 'line_items',
          validationType: 'not_empty',
          validationCondition: 'array_length > 0',
          errorMessage: '抽出条件の定義に失敗しました。システム管理者に連絡してください。',
          warningLevel: 'error',
          validFlag: true,
          applicationStartDate: '2024-01-01',
          applicationEndDate: null,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          createdBy: 'ADMIN',
          updatedBy: 'ADMIN',
        },
      ],
      totalCount: 1,
      fetchedAt: '2024-01-31T00:00:00Z',
    };

    // モックの設定
    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue(
      mockAllCustomersOutput
    );

    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue(
      mockDealsForPeriodOutput
    );

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue(
      mockInvoicesForPeriodOutput
    );

    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue(
      mockAllDealStagesOutput
    );

    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue(
      mockAllValidationRulesOutput
    );

    const input: PrepareMonthlyClosingInput = {
      closingInstructionId: 'INSTR-20240131-001',
      targetMonth: '2024-01',
      operatorUserId: 'USR-SALES-OP-001',
      executionTimestamp: new Date('2024-02-01T09:00:00Z'),
    };

    // prepareMonthlyClosingを呼び出し、ExtractionCriteriaDefinitionFailedエラーがスローされることを期待
    await expect(prepareMonthlyClosing(input)).rejects.toThrow(
      ExtractionCriteriaDefinitionFailed
    );

    // fetchInvoicesForPeriodが正しい引数で呼ばれたかを確認
    expect(dataPersistence.fetchInvoicesForPeriod).toHaveBeenCalled();
  });
});
