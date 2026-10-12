import { fetchActivitiesByRepresentative, SalesRepresentativeNotFound } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store.ts');

describe('SCEN-823: 営業担当者IDが営業担当者テーブルに存在しない場合、SalesRepresentativeNotFoundエラーが発生', () => {
  const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw SalesRepresentativeNotFound error when representative does not exist', async () => {
    const mockDataStore = require('../../src/platform/data-store.ts');
    mockDataStore.listRecords.mockResolvedValue([]);

    await expect(fetchActivitiesByRepresentative({ salesRepresentativeId })).rejects.toThrow(SalesRepresentativeNotFound);
    await expect(fetchActivitiesByRepresentative({ salesRepresentativeId })).rejects.toThrow('指定された営業担当者が見つかりません。');
  });
});
