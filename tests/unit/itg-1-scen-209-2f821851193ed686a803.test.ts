import {
  validateInvoiceOutputPrerequisites,
  ValidateInvoiceOutputPrerequisitesInput,
  ExecutionContext,
} from '../../src/logic/invoice-output-validation';

describe('SCEN-209: validateInvoiceOutputPrerequisites - 商談ID不正エラー', () => {
  const executionContext: ExecutionContext = {
    userId: 'USER-001',
    executionTimestamp: '2026-10-07T10:00:00Z',
    sessionId: 'SESSION-001',
  };

  it('商談IDが空の場合、例外をスローする', async () => {
    const input: ValidateInvoiceOutputPrerequisitesInput = {
      dealId: '',
      executionContext,
    };

    await expect(validateInvoiceOutputPrerequisites(input)).rejects.toThrow(
      '商談IDが指定されていません。有効な商談を選択してください。'
    );
  });
});
