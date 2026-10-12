import { validateInvoiceReferenceIntegrity } from '../../src/logic/deal-invoice-reconciliation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-108: 商談IDが空文字列または不正な形式の場合、例外がスローされる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('商談IDが空文字列の場合、例外がスローされ、エラーメッセージが「商談IDが無効です。画面を再読み込みしてください。」である', async () => {
    const dealId = '';

    await expect(validateInvoiceReferenceIntegrity({ dealId })).rejects.toThrow();
    await expect(validateInvoiceReferenceIntegrity({ dealId })).rejects.toThrow('商談IDが無効です。画面を再読み込みしてください。');
  });
});
