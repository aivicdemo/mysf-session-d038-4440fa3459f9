import { judgeInvoiceStatusConsistency } from '../../src/logic/invoice-status-judgment';

describe('SCEN-278: 商談IDが空の場合、業務ルールの制約により検証は実行せず例外を発生させる', () => {
  it('should throw error when dealId is empty', async () => {
    const executedAt = new Date('2026-10-07T10:00:00Z');

    await expect(
      judgeInvoiceStatusConsistency({
        dealId: '',
        executedAt,
      })
    ).rejects.toThrow('商談IDが指定されていません');
  });
});
