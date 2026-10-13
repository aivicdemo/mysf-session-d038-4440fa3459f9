import { validateDataIntegrityForMonthlyClose } from '../../src/logic/data-integrity-validation-engine';

describe('SCEN-066: 商談ステータスと請求ステータスが対応ルールに違反しているとき、ステータス対応ルール違反として検出される', () => {
  it('商談ステータスと請求ステータスが対応ルール違反として検出される', async () => {
    const input = {
      dealRecords: [
        {
          dealId: 'DEAL-001',
          accountId: 'ACC-001',
          dealStatus: '成約',
          dealAmount: 100000,
          invoiceIds: ['INV-001'],
        },
      ],
      invoiceRecords: [
        {
          invoiceId: 'INV-001',
          accountId: 'ACC-001',
          dealId: 'DEAL-001',
          invoiceStatus: 'ドラフト',
          invoiceAmount: 100000,
        },
      ],
      statusCorrespondenceRules: [
        {
          dealStatus: '成約',
          allowedInvoiceStatuses: ['請求済み', '入金済み'],
        },
      ],
      amountToleranceCriteria: {
        tolerancePercentage: 5,
        toleranceAbsoluteAmount: 1000,
      },
      executionTimestamp: new Date('2026-01-15T10:00:00.000Z'),
    };

    const result = await validateDataIntegrityForMonthlyClose(input);

    expect(result.validationResult).toBe('FAILED_WITH_VIOLATIONS');
    expect(result.totalDealsValidated).toBe(1);
    expect(result.totalInvoicesValidated).toBe(1);

    expect(result.statusCorrespondenceViolations.length).toBeGreaterThanOrEqual(1);
    const violation = result.statusCorrespondenceViolations.find(
      (v) =>
        v.dealId === 'DEAL-001' &&
        v.invoiceId === 'INV-001' &&
        v.dealStatus === '成約' &&
        v.invoiceStatus === 'ドラフト'
    );
    expect(violation).toBeDefined();
    expect(violation?.description).toContain('ステータス対応ルール検証エラー');
    expect(violation?.description).toContain('商談ステータスと請求ステータスが対応していません');

    expect(result.abnormalCasesList.length).toBeGreaterThanOrEqual(1);
    const abnormalCase = result.abnormalCasesList.find(
      (c) => c.dealId === 'DEAL-001'
    );
    expect(abnormalCase).toBeDefined();
    expect(abnormalCase?.violationTypes).toContain('STATUS_CORRESPONDENCE_VIOLATION');
    expect(['HIGH', 'CRITICAL']).toContain(abnormalCase?.severity);
    expect(abnormalCase?.correctionRequired).toBe(true);
  });
});
