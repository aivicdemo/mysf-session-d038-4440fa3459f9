import { fetchSalesTargets } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-953: 営業目標マスタテーブルの全レコード取得と totalCount 反映', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('取得した営業目標レコードの総件数が totalCount フィールドに正確に反映される', async () => {
    const mockSalesTargets = [
      {
        salesTargetId: 'uuid-target-001',
        salesRepresentativeId: 'uuid-sales-001',
        customerId: 'uuid-client-001',
        targetYearMonth: '2024-01',
        targetAmount: 1000000,
        targetCount: 5,
        status: 'active',
        remarks: 'Q1目標',
        createdAt: '2024-01-01T00:00:00Z',
        createdBy: 'admin',
        updatedAt: '2024-01-01T00:00:00Z',
        updatedBy: 'admin',
      },
      {
        salesTargetId: 'uuid-target-002',
        salesRepresentativeId: 'uuid-sales-002',
        customerId: 'uuid-client-002',
        targetYearMonth: '2024-01',
        targetAmount: 1500000,
        targetCount: 8,
        status: 'active',
        remarks: 'Q1目標',
        createdAt: '2024-01-01T00:00:00Z',
        createdBy: 'admin',
        updatedAt: '2024-01-01T00:00:00Z',
        updatedBy: 'admin',
      },
      {
        salesTargetId: 'uuid-target-003',
        salesRepresentativeId: 'uuid-sales-001',
        customerId: 'uuid-client-003',
        targetYearMonth: '2024-02',
        targetAmount: 1200000,
        targetCount: 6,
        status: 'active',
        remarks: 'Q1目標',
        createdAt: '2024-02-01T00:00:00Z',
        createdBy: 'admin',
        updatedAt: '2024-02-01T00:00:00Z',
        updatedBy: 'admin',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockSalesTargets);

    const result = await fetchSalesTargets({});

    expect(result.totalCount).toBe(3);
    expect(result.salesTargets).toHaveLength(3);
    expect(result.salesTargets[0].salesTargetId).toBe('uuid-target-001');
    expect(result.salesTargets[1].salesTargetId).toBe('uuid-target-002');
    expect(result.salesTargets[2].salesTargetId).toBe('uuid-target-003');
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/);
  });
});
