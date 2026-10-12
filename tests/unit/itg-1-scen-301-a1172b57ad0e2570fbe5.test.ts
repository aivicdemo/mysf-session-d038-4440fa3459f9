import {
  validateDealInvoiceLinkAndTransition,
  ValidateDealInvoiceLinkAndTransitionInput,
  ValidateDealInvoiceLinkAndTransitionOutput,
  ValidationDetail,
} from '../../src/logic/deal-invoice-link-validation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-301: validateDealInvoiceLinkAndTransition - Happy path with valid references', () => {
  const dealId = '550e8400-e29b-41d4-a716-446655440000';
  const targetStage = '請求済み';
  const userId = 'user-001';
  const operationTimestamp = new Date('2026-10-07T10:30:00Z');

  const dealRecord = {
    dealId,
    dealName: 'ABC社システム導入案件',
    dealAmount: 500000,
    dealStatus: '受注確定',
    contractDate: '2026-09-01T00:00:00Z',
    customerId: 'cust-001',
    salesRepresentativeId: 'rep-001',
    stageId: 'stage-002',
    expectedContractDate: '2026-09-01T00:00:00Z',
    contractedDate: '2026-09-01T00:00:00Z',
    description: null,
    lossReason: null,
    invoiceGenerationSLADeadline: null,
    invoiceSLAExceededFlag: false,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
    createdBy: 'admin',
  };

  const relatedInvoices = [
    {
      invoiceId: 'inv-001',
      dealId,
      invoiceAmount: 250000,
      invoiceStatus: '発行済み',
      invoiceDate: '2026-09-15T00:00:00Z',
      customerId: 'cust-001',
      salesRepresentativeId: 'rep-001',
      invoiceNumber: 'INV-001',
      dueDate: '2026-10-15T00:00:00Z',
      taxAmount: 0,
      untaxedAmount: 250000,
      paidDate: null,
      paidAmount: null,
      remarks: null,
      modificationReason: null,
      reissueCount: 0,
      lastReissuedAt: null,
      amountCalculationVerificationStatus: 'verified',
      referenceIntegrityVerificationStatus: 'verified',
      createdAt: '2026-09-15T00:00:00Z',
      updatedAt: '2026-09-15T00:00:00Z',
      createdBy: 'admin',
    },
    {
      invoiceId: 'inv-002',
      dealId,
      invoiceAmount: 250000,
      invoiceStatus: '発行済み',
      invoiceDate: '2026-09-20T00:00:00Z',
      customerId: 'cust-001',
      salesRepresentativeId: 'rep-001',
      invoiceNumber: 'INV-002',
      dueDate: '2026-10-20T00:00:00Z',
      taxAmount: 0,
      untaxedAmount: 250000,
      paidDate: null,
      paidAmount: null,
      remarks: null,
      modificationReason: null,
      reissueCount: 0,
      lastReissuedAt: null,
      amountCalculationVerificationStatus: 'verified',
      referenceIntegrityVerificationStatus: 'verified',
      createdAt: '2026-09-20T00:00:00Z',
      updatedAt: '2026-09-20T00:00:00Z',
      createdBy: 'admin',
    },
  ];

  const invoiceLineItems = [
    {
      lineItemId: 'line-001',
      invoiceId: 'inv-001',
      dealId,
      itemDescription: 'システム開発費',
      quantity: 1,
      unitPrice: 250000,
      lineAmount: 250000,
      lineNumber: 1,
      productName: 'システム開発費',
      productDescription: null,
      taxRate: 0,
      taxAmount: 0,
      taxIncludedAmount: 250000,
      remarks: null,
      modificationPreviousQuantity: null,
      modificationPreviousUnitPrice: null,
      modificationPreviousAmount: null,
      createdAt: '2026-09-15T00:00:00Z',
      updatedAt: '2026-09-15T00:00:00Z',
      createdBy: 'admin',
    },
    {
      lineItemId: 'line-002',
      invoiceId: 'inv-002',
      dealId,
      itemDescription: '導入サポート費',
      quantity: 1,
      unitPrice: 250000,
      lineAmount: 250000,
      lineNumber: 1,
      productName: '導入サポート費',
      productDescription: null,
      taxRate: 0,
      taxAmount: 0,
      taxIncludedAmount: 250000,
      remarks: null,
      modificationPreviousQuantity: null,
      modificationPreviousUnitPrice: null,
      modificationPreviousAmount: null,
      createdAt: '2026-09-20T00:00:00Z',
      updatedAt: '2026-09-20T00:00:00Z',
      createdBy: 'admin',
    },
  ];

  const dealStageDefinition = [
    {
      stageId: 'stage-001',
      stageName: '見込み客',
      stageOrder: 1,
      description: null,
      contractedStageFlag: false,
      lostStageFlag: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      createdBy: 'admin',
    },
    {
      stageId: 'stage-002',
      stageName: '受注確定',
      stageOrder: 2,
      description: null,
      contractedStageFlag: true,
      lostStageFlag: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      createdBy: 'admin',
    },
    {
      stageId: 'stage-003',
      stageName: '請求済み',
      stageOrder: 3,
      description: null,
      contractedStageFlag: true,
      lostStageFlag: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      createdBy: 'admin',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    const mockDataPersistence = {
      ...jest.requireActual<typeof dataPersistence>(
        '../../src/logic/data-persistence'
      ),
      fetchDealById: jest.fn(),
      fetchInvoicesForPeriod: jest.fn(),
      fetchInvoiceLineItemsByInvoice: jest.fn(),
      fetchAllDealStages: jest.fn(),
    };

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(dealRecord);
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: relatedInvoices,
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });
    (
      dataPersistence.fetchInvoiceLineItemsByInvoice as jest.Mock
    ).mockImplementation((input) => {
      const items = invoiceLineItems.filter(
        (item) => item.invoiceId === input.invoiceId
      );
      return Promise.resolve({
        lineItems: items,
        totalCount: items.length,
        fetchedAt: new Date().toISOString(),
      });
    });
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({
      stages: dealStageDefinition,
      totalCount: 3,
      fetchedAt: new Date().toISOString(),
    });
  });

  it('should allow transition when all validations pass', async () => {
    const input: ValidateDealInvoiceLinkAndTransitionInput = {
      dealId,
      targetStage,
      userId,
      operationTimestamp,
    };

    const result = await validateDealInvoiceLinkAndTransition(input);

    expect(result.isValid).toBe(true);
    expect(result.dealId).toBe(dealId);
    expect(result.targetStage).toBe(targetStage);
    expect(result.relatedInvoiceCount).toBe(2);
    expect(result.totalInvoiceAmount).toBe(500000);

    const validationDetailsMap = result.validationDetails.reduce(
      (acc, detail) => {
        acc[detail.itemName] = detail;
        return acc;
      },
      {} as Record<string, ValidationDetail>
    );

    const expectedDetails = [
      '商談レコード存在確認',
      '関連請求書存在確認',
      '商談金額と請求書合計金額の一致確認',
      '請求書ステータス確認',
      '請求明細存在確認',
      '参照関係整合性確認',
      'ステージ遷移ルール確認',
    ];

    expectedDetails.forEach((detailName) => {
      expect(validationDetailsMap[detailName]).toBeDefined();
      expect(validationDetailsMap[detailName]?.isValid).toBe(true);
      expect(validationDetailsMap[detailName]?.message).toBeDefined();
      expect(validationDetailsMap[detailName]?.message.length).toBeGreaterThan(
        0
      );
    });

    // Verify specific messages match expected content
    expect(
      validationDetailsMap['商談レコード存在確認']?.message
    ).toContain('商談が見つかりました');

    expect(
      validationDetailsMap['関連請求書存在確認']?.message
    ).toContain('関連する請求書2件が見つかりました');

    expect(
      validationDetailsMap['商談金額と請求書合計金額の一致確認']?.message
    ).toContain('商談金額500000と請求書合計金額500000が一致しています');

    expect(
      validationDetailsMap['請求書ステータス確認']?.message
    ).toContain('すべての請求書ステータスが発行済みです');

    expect(
      validationDetailsMap['請求明細存在確認']?.message
    ).toContain('すべての請求書に請求明細が存在します');

    expect(
      validationDetailsMap['参照関係整合性確認']?.message
    ).toContain('請求書と商談の参照関係が正常です');

    expect(
      validationDetailsMap['ステージ遷移ルール確認']?.message
    ).toContain('受注確定から請求済みへのステージ遷移が有効です');
  });
});
