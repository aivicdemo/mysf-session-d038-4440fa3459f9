import type { DetectInvoiceDelayAndClassifyPriorityInput } from '../../src/logic/invoice-delay-detection';
import { detectInvoiceDelayAndClassifyPriority, InvalidDateRange } from '../../src/logic/invoice-delay-detection';

describe('SCEN-290: detectInvoiceDelayAndClassifyPriority - 無効な期間範囲エラーテスト', () => {
  it('検査対象期間の開始日が終了日より後である場合、InvalidDateRange エラーを発生させる', async () => {
    const input: DetectInvoiceDelayAndClassifyPriorityInput = {
      salesRepresentativeId: 'SR-001',
      targetPeriodStart: new Date('2024-12-25'),
      targetPeriodEnd: new Date('2024-12-20'),
      currentDateTime: new Date('2024-12-26T10:00:00Z'),
    };

    await expect(detectInvoiceDelayAndClassifyPriority(input)).rejects.toThrow(InvalidDateRange);
    await expect(detectInvoiceDelayAndClassifyPriority(input)).rejects.toThrow('検査対象期間の指定が不正です。開始日は終了日以前である必要があります。');
  });
});
