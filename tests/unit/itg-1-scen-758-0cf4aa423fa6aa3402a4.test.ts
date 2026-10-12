import { saveSalesRepresentative } from '../../src/logic/data-persistence';
import type { SaveSalesRepresentativeInput, SaveSalesRepresentativeOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-758: saveSalesRepresentative - 更新時のcreatedBy・updatedBy検証', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('更新時にupdatedByが操作ユーザーIDで、createdByが変更されずに記録される', async () => {
    const existingRecord = {
      id: 'rep-001',
      営業担当者ID: 'rep-001',
      名前: '山田太郎',
      メールアドレス: 'yamada@example.com',
      電話番号: '09012345678',
      部門: '営業部',
      役職: '営業課長',
      上司ID: null,
      ステータス: '有効',
      createdAt: '2025-01-01T10:00:00Z',
      updatedAt: '2025-01-01T10:00:00Z',
      作成者: 'user-admin',
      更新者: null,
    };

    (dataStore.listRecords as jest.Mock).mockResolvedValue([existingRecord]);

    const mockOutput: SaveSalesRepresentativeOutput = {
      salesRepresentativeId: 'rep-001',
      name: '山田太郎',
      emailAddress: 'yamada@example.com',
      phoneNumber: '09087654321',
      department: '営業部',
      jobTitle: '営業主任',
      supervisorId: null,
      status: '有効',
      createdAt: '2025-01-01T10:00:00Z',
      updatedAt: '2025-01-15T14:30:00Z',
      createdBy: 'user-admin',
      updatedBy: 'user-update-001',
    };

    (dataStore.updateRecord as jest.Mock).mockResolvedValue(mockOutput);

    const input: SaveSalesRepresentativeInput = {
      salesRepresentativeId: 'rep-001',
      name: '山田太郎',
      emailAddress: 'yamada@example.com',
      phoneNumber: '09087654321',
      department: '営業部',
      jobTitle: '営業主任',
      supervisorId: null,
      status: '有効',
      currentUserId: 'user-update-001',
      operationTimestamp: '2025-01-15T14:30:00Z',
    };

    const result = await saveSalesRepresentative(input);

    expect(result.salesRepresentativeId).toBe('rep-001');
    expect(result.name).toBe('山田太郎');
    expect(result.emailAddress).toBe('yamada@example.com');
    expect(result.phoneNumber).toBe('09087654321');
    expect(result.department).toBe('営業部');
    expect(result.jobTitle).toBe('営業主任');
    expect(result.supervisorId).toBeNull();
    expect(result.status).toBe('有効');
    expect(result.createdAt).toBe('2025-01-01T10:00:00Z');
    expect(result.updatedAt).toBe('2025-01-15T14:30:00Z');
    expect(result.createdBy).toBe('user-admin');
    expect(result.updatedBy).toBe('user-update-001');
  });
});
