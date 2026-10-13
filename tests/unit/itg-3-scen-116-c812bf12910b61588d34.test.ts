import { validateCorrectionContentAndJudgeApproval } from '../../src/logic/correction-content-validation-engine';

describe('SCEN-116: 複数の新たな不整合が検出された場合、newDiscrepanciesDetectedの配列に全件が含まれる', () => {
  it('should return requires_manual_review with all new discrepancies detected', async () => {
    const input = {
      discrepancyId: 'disc-001',
      correctionBeforeData: {
        dealId: 'deal-123',
        amount: 1000000,
        status: 'negotiation',
        accountId: 'acc-456',
        lineItems: [
          {
            itemId: 'item-1',
            quantity: 10,
            unitPrice: 100000,
          },
        ],
      },
      correctionAfterData: {
        dealId: 'deal-123',
        amount: 1000000,
        status: 'closed_won',
        accountId: 'acc-456',
        lineItems: [
          {
            itemId: 'item-1',
            quantity: 10,
            unitPrice: 100000,
          },
        ],
      },
      approvalCriteria: {
        maxAmountVariance: 50000,
        requiredFields: ['dealId', 'amount', 'status', 'accountId'],
        validStatusTransitions: {
          negotiation: ['closed_won', 'closed_lost'],
          closed_won: ['closed_won'],
        },
        amountCheckType: 'strict',
      },
      correctionExecutorUserId: 'user-sales-001',
      correctionExecutedAt: new Date('2024-01-15T10:30:00Z'),
      currentDateTime: new Date('2024-01-15T11:00:00Z'),
    };

    const output = await validateCorrectionContentAndJudgeApproval(input);

    expect(output.validationResult).toBe('requires_manual_review');

    expect(output.correctionDifference).toEqual({
      status: { before: 'negotiation', after: 'closed_won' },
    });

    expect(output.approvalCriteriaMet).toBe(true);

    expect(output.integrityVerificationResult.referenceChainValid).toBe(true);
    expect(output.integrityVerificationResult.statusCorrespondenceValid).toBe(true);
    expect(output.integrityVerificationResult.amountDiscrepancyDetected).toBe(false);

    expect(output.integrityVerificationResult.newDiscrepanciesDetected).toHaveLength(3);

    const discrepancies = output.integrityVerificationResult.newDiscrepanciesDetected;

    expect(discrepancies).toContainEqual({
      type: 'status_mismatch',
      description:
        "レガシーシステムでは仕入先A向けステータスが『交渉中』のまま、新システムでは『クローズ済み』に更新。仕入先別マスタに未登録の取引先コードが混在。",
    });

    expect(discrepancies).toContainEqual({
      type: 'reference_integrity_violation',
      description:
        '商談deal-123に紐付く請求明細のうち、請求書inv-789が削除されているのに金額ロジックには残存。',
    });

    expect(discrepancies).toContainEqual({
      type: 'amount_discrepancy_new',
      description:
        'レガシー側の集計金額1,000,000円に対し、新システム側で消費税計算ロジックが追加された結果1,100,000円に。',
    });

    expect(output.discrepancyResolved).toBe(false);

    expect(output.validationReport).toContain('新たな不整合が3件検出');
  });
});
