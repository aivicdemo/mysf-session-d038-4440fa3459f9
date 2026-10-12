import { detectInvoiceDelayAndClassifyPriority, NoDealsFoundForRepresentative } from '../../src/logic/invoice-delay-detection';
import * as dataPersistenceModule from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({ ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'), fetchDealsWithInvoices: jest.fn() }));

describe('SCEN-291: 指定された営業担当者に対象期間内の商談が存在しない場合、NoDealsFoundForRepresentative エラーを発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('NoDealsFoundForRepresentative エラーを発生させる', async () => {
    const mockFetchDealsWithInvoices = dataPersistenceModule.fetchDealsWithInvoices as jest.MockedFunction<any>;

    mockFetchDealsWithInvoices.mockResolvedValue([]);

    await expect(
      detectInvoiceDelayAndClassifyPriority({
        salesRepresentativeId: 'REP-001',
        targetPeriodStart: new Date('2024-01-01'),
        targetPeriodEnd: new Date('2024-01-31'),
        currentDateTime: new Date('2024-02-15T10:00:00Z'),
      })
    ).rejects.toThrow(NoDealsFoundForRepresentative);
  });
});
