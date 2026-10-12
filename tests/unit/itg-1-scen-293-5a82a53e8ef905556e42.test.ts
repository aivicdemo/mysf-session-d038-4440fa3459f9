import { detectInvoiceDelayAndClassifyPriority, SLACalculationFailed } from '../../src/logic/invoice-delay-detection';
import * as dataPersistenceModule from '../../src/logic/data-persistence';
import * as invoiceSLAModule from '../../src/logic/invoice-sla-monitoring';
import * as invoiceStatusModule from '../../src/logic/invoice-status-classification';

jest.mock('../../src/logic/data-persistence', () => ({ ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'), fetchDealsWithInvoices: jest.fn() }));
jest.mock('../../src/logic/invoice-sla-monitoring', () => ({ ...jest.requireActual<typeof import('../../src/logic/invoice-sla-monitoring')>('../../src/logic/invoice-sla-monitoring'), calculateInvoiceSLADeadline: jest.fn() }));
jest.mock('../../src/logic/invoice-status-classification', () => ({ ...jest.requireActual<typeof import('../../src/logic/invoice-status-classification')>('../../src/logic/invoice-status-classification'), classifyInvoiceStatus: jest.fn() }));

describe('SCEN-293: SLA期限計算処理が失敗した場合、SLACalculationFailed エラーを発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('SLACalculationFailed エラーを発生させる', async () => {
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
        dealAmount: 100000,
        dealClosedDate: '2024-01-15',
        invoiceId: 'INV-001',
        invoiceStatus: '送付済',
        invoiceAmount: 100000,
        invoiceDueDate: '2024-02-15',
      },
    ];

    mockFetchDealsWithInvoices.mockResolvedValue(dealsWithInvoices);

    mockCalculateInvoiceSLADeadline.mockRejectedValue(new Error('SLA calculation error'));

    mockClassifyInvoiceStatus.mockResolvedValue([
      {
        dealId: 'DEAL-001',
        invoiceStatus: '送付済',
      },
    ]);

    await expect(
      detectInvoiceDelayAndClassifyPriority({
        salesRepresentativeId: 'REP-001',
        targetPeriodStart: new Date('2024-01-01'),
        targetPeriodEnd: new Date('2024-01-31'),
        currentDateTime: new Date('2024-02-15T10:00:00Z'),
      })
    ).rejects.toThrow(SLACalculationFailed);
  });
});
