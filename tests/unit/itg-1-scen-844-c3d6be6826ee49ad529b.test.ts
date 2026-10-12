import { fetchAllSalesRepresentatives } from '../../src/logic/data-persistence';
import * as DataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-844: 営業担当者テーブルに複数レコードが保存されている場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all sales representatives with correct structure', async () => {
    const mockSalesReps = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440001',
        name: '山田太郎',
        emailAddress: 'yamada.taro@example.com',
        phoneNumber: '09012345678',
        department: '営業部',
        jobTitle: '営業課長',
        supervisorId: '550e8400-e29b-41d4-a716-446655440099',
        status: 'active',
        createdAt: '2026-01-15T10:00:00.000Z',
        updatedAt: '2026-01-15T10:00:00.000Z',
        createdBy: 'admin',
        updatedBy: 'admin',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440002',
        name: '鈴木花子',
        emailAddress: 'suzuki.hanako@example.com',
        phoneNumber: '09087654321',
        department: '営業部',
        jobTitle: '営業',
        supervisorId: '550e8400-e29b-41d4-a716-446655440001',
        status: 'active',
        createdAt: '2026-01-20T14:30:00.000Z',
        updatedAt: '2026-01-20T14:30:00.000Z',
        createdBy: 'admin',
        updatedBy: 'admin',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440003',
        name: '佐藤次郎',
        emailAddress: 'sato.jiro@example.com',
        phoneNumber: '09011111111',
        department: '営業企画部',
        jobTitle: '営業企画',
        supervisorId: '550e8400-e29b-41d4-a716-446655440099',
        status: 'inactive',
        createdAt: '2026-02-01T09:15:00.000Z',
        updatedAt: '2026-02-01T09:15:00.000Z',
        createdBy: 'admin',
        updatedBy: 'admin',
      },
    ];

    (DataStore.listRecords as jest.Mock).mockResolvedValue(mockSalesReps);

    const result = await fetchAllSalesRepresentatives({});

    expect(result.salesRepresentatives).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    expect(result.salesRepresentatives[0].salesRepresentativeId).toBe(
      '550e8400-e29b-41d4-a716-446655440001'
    );
    expect(result.salesRepresentatives[1].salesRepresentativeId).toBe(
      '550e8400-e29b-41d4-a716-446655440002'
    );
    expect(result.salesRepresentatives[2].salesRepresentativeId).toBe(
      '550e8400-e29b-41d4-a716-446655440003'
    );
  });
});
