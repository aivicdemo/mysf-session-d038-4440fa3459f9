import { notifyInvoiceSLAExceeded, InvalidSLADeadlineFormat, NotifyInvoiceSLAExceededInput } from '../../src/logic/notification-service';

describe('SCEN-1075: 請求生成SLA期限が無効な日時形式のとき、InvalidSLADeadlineFormat エラーが発生する', () => {

  it('無効な日時形式でエラーを throw', async () => {
    const invalidInput: NotifyInvoiceSLAExceededInput = {
      dealWithSLAStatus: {
        dealId: 'DEAL-20250101-001',
        dealName: '大型商談A',
        customerId: 'CUST-001',
        customerName: '株式会社ABC',
        salesRepresentativeId: 'SR-001',
        salesRepresentativeName: '営業太郎',
        invoiceGenerationSLADeadline: new Date('invalid-date-string'),
        requestGenerationSLAExceededFlag: true,
        dealAmount: 5000000,
        dealStage: 'クローズ予定',
      },
      notificationChannels: ['email', 'in_app'] as Array<'email' | 'sms' | 'in_app'>,
      urgencyLevel: 'high' as const,
      escalateToSupervisor: false,
      currentDateTime: new Date('2025-01-15T10:30:00Z'),
    };

    await expect(notifyInvoiceSLAExceeded(invalidInput)).rejects.toThrow(InvalidSLADeadlineFormat);
    await expect(notifyInvoiceSLAExceeded(invalidInput)).rejects.toThrow(
      /請求生成SLA期限の形式が不正です/
    );
  });
});
