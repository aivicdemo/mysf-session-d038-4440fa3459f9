import { prepareMonthlyClosing, InvalidClosingPeriod } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1563: 期間開始日が終了日より後ならエラー発生し処理中断', () => {
  const mockDataPersistence = dataPersistence as jest.Mocked<typeof dataPersistence>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('対象期間の開始日が終了日より後の場合、InvalidClosingPeriodエラーをスロー', async () => {
    // 前提条件のセットアップ
    const input = {
      closingInstructionId: 'CI-2024-001',
      targetMonth: '2024-02',
      operatorUserId: 'USR-OP-001',
      executionTimestamp: new Date('2024-03-05T10:00:00Z'),
    };

    // モック依存関数の設定
    mockDataPersistence.fetchAllCustomers.mockResolvedValue({
      customers: [
        {
          customerId: 'C-001',
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
          status: 'active',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
      ],
      totalCount: 1,
      fetchedAt: new Date().toISOString(),
    });

    mockDataPersistence.fetchDealsForPeriod.mockResolvedValue({
      deals: [
        {
          dealId: 'D-001',
          dealName: '案件A',
          customerId: 'C-001',
          dealAmount: 100000,
          stageId: 'STAGE-001',
          salesRepresentativeId: 'SR-001',
          expectedContractDate: '2024-02-15',
          contractedDate: '2024-02-15',
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2024-02-10',
          updatedAt: '2024-02-15',
          createdBy: 'USER-001',
        },
      ],
      totalCount: 1,
      fetchedAt: new Date().toISOString(),
    });

    mockDataPersistence.fetchInvoicesForPeriod.mockResolvedValue({
      invoices: [
        {
          invoiceId: 'INV-001',
          dealId: 'D-001',
          customerId: 'C-001',
          salesRepresentativeId: 'SR-001',
          invoiceNumber: 'INV-2024-001',
          invoiceDate: '2024-02-20',
          dueDate: '2024-03-20',
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
          createdAt: '2024-02-20',
          updatedAt: '2024-02-20',
          createdBy: 'USER-001',
        },
      ],
      totalCount: 1,
      fetchedAt: new Date().toISOString(),
    });

    mockDataPersistence.fetchAllDealStages.mockResolvedValue({
      stages: [
        {
          stageId: 'STAGE-001',
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
      totalCount: 1,
      fetchedAt: new Date().toISOString(),
    });

    mockDataPersistence.fetchAllValidationRules.mockResolvedValue({
      validationRules: [
        {
          validationRuleId: 'RULE-001',
          ruleName: '金額範囲チェック',
          ruleDescription: null,
          targetTable: 'deal',
          targetColumn: 'dealAmount',
          validationType: 'range',
          validationCondition: 'amount >= 0',
          errorMessage: '金額は0以上である必要があります',
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
      totalCount: 1,
      fetchedAt: new Date().toISOString(),
    });

    // テスト実行: 期間開始日が終了日より後の場合、エラーが発生することを確認
    await expect(prepareMonthlyClosing(input)).rejects.toThrow(InvalidClosingPeriod);

    // エラーメッセージが正しいことを確認
    try {
      await prepareMonthlyClosing(input);
    } catch (error) {
      if (error instanceof InvalidClosingPeriod) {
        expect(error.message).toContain('対象期間の設定が不正です');
        expect(error.message).toContain('開始日が終了日より後になっています');
      }
    }
  });
});
