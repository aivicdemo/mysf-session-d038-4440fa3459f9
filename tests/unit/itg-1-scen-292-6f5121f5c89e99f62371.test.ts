import { detectInvoiceDelayAndClassifyPriority, InvoiceStatusClassificationFailed } from '../../src/logic/invoice-delay-detection';
import * as dataPersistenceModule from '../../src/logic/data-persistence';
import * as invoiceSLAModule from '../../src/logic/invoice-sla-monitoring';
import * as invoiceStatusModule from '../../src/logic/invoice-status-classification';

jest.mock('../../src/logic/data-persistence', () => ({ ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'), fetchDealsWithInvoices: jest.fn() }));
jest.mock('../../src/logic/invoice-sla-monitoring', () => ({ ...jest.requireActual<typeof import('../../src/logic/invoice-sla-monitoring')>('../../src/logic/invoice-sla-monitoring'), calculateInvoiceSLADeadline: jest.fn() }));
jest.mock('../../src/logic/invoice-status-classification', () => ({ ...jest.requireActual<typeof import('../../src/logic/invoice-status-classification')>('../../src/logic/invoice-status-classification'), classifyInvoiceStatus: jest.fn() }));

describe('SCEN-292: 請求ステータス分類処理が失敗した場合、InvoiceStatusClassificationFailed エラーを発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('InvoiceStatusClassificationFailed エラーを発生させる', async () => {
    const mockFetchDealsWithInvoices = dataPersistenceModule.fetchDealsWithInvoices as jest.MockedFunction<any>;
    const mockCalculateInvoiceSLADeadline = invoiceSLAModule.calculateInvoiceSLADeadline as jest.MockedFunction<any>;
    const mockClassifyInvoiceStatus = invoiceStatusModule.classifyInvoiceStatus as jest.MockedFunction<any>;

    const dealsWithInvoices = [
      {
        dealId: 'DEAL-001',
        dealName: 'Deal 001',
        customerId: 'CUST-001',
        customerName: 'Customer 001',
        dealStatus: '受注',
        dealAmount: 1000000,
        invoiceId: 'INV-001',
        invoiceStatus: '作成済',
        invoiceAmount: 1000000,
        invoiceDueDate: '2024-06-10',
      },
    ];

    mockFetchDealsWithInvoices.mockResolvedValue(dealsWithInvoices);

    mockCalculateInvoiceSLADeadline.mockResolvedValue([
      {
        dealId: 'DEAL-001',
        slaDeadline: '2024-06-05',
        actualInvoiceDate: '2024-06-08',
      },
    ]);

    mockClassifyInvoiceStatus.mockRejectedValue(new Error('Classification failed'));

    await expect(
      detectInvoiceDelayAndClassifyPriority({
        salesRepresentativeId: 'REP-001',
        targetPeriodStart: new Date('2024-01-01'),
        targetPeriodEnd: new Date('2024-12-31'),
        currentDateTime: new Date('2024-06-15T10:00:00Z'),
      })
    ).rejects.toThrow(InvoiceStatusClassificationFailed);
  });
});
