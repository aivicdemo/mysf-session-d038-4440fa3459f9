import { fetchActivitiesByRepresentative, SalesRepresentativeNotFound } from '../../src/logic/data-persistence';
import * as platformDataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1535: 分析対象期間の形式が不正なとき例外が発生する', () => {
  

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('salesRepresentativeIdがUUID形式ではない場合、SalesRepresentativeNotFoundエラーが発生する', async () => {
    const salesRepresentativeId = 'invalid-format-not-uuid';

    const salesRepresentatives = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: '営業太郎',
        emailAddress: 'taro@example.com',
        phoneNumber: '090-1234-5678',
        department: '営業部',
        jobTitle: '営業課長',
        supervisorId: '550e8400-e29b-41d4-a716-446655440001',
        status: 'active',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        createdBy: 'admin',
      },
    ];

    jest.spyOn(platformDataStore, 'listRecords')
      .mockResolvedValueOnce(salesRepresentatives as any);

    await expect(
      fetchActivitiesByRepresentative({ salesRepresentativeId })
    ).rejects.toThrow(SalesRepresentativeNotFound);
  });
});
