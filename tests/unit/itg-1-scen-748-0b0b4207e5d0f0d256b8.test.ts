import { saveSalesRepresentative, SaveSalesRepresentativeInput, SaveSalesRepresentativeOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  updateRecord: jest.fn(),
}));

describe('SCEN-748: 既存営業担当者の更新時に必須フィールド（名前・メールアドレス・部門）がすべて入力されていれば、既存レコードが現在時刻で更新され、変更内容を含む完全なレコードが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('既存レコード更新時に必須フィールドがすべて入力された場合、既存のcreatedAt/createdByは保持され、updatedAt/updatedByが更新される', async () => {
    const mockListRecords = jest.mocked(dataStore.listRecords);
    const mockUpdateRecord = jest.mocked(dataStore.updateRecord);

    const existingRecord = {
      id: 'rep-001',
      salesRepresentativeId: 'rep-001',
      name: '山田太郎',
      emailAddress: 'yamada@example.com',
      phoneNumber: '09012345678',
      department: '営業部',
      jobTitle: '営業課長',
      supervisorId: null,
      status: '有効',
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
      createdBy: 'admin',
      updatedBy: null,
    };

    mockListRecords.mockResolvedValue([existingRecord]);
    mockUpdateRecord.mockResolvedValue({
      id: 'rep-001',
      salesRepresentativeId: 'rep-001',
      name: '山田太郎（更新版）',
      emailAddress: 'yamada.new@example.com',
      phoneNumber: '09087654321',
      department: '営業部',
      jobTitle: '営業部長',
      supervisorId: null,
      status: '有効',
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-06-15T14:30:00Z',
      createdBy: 'admin',
      updatedBy: 'user-update-001',
    });

    const input: SaveSalesRepresentativeInput = {
      salesRepresentativeId: 'rep-001',
      name: '山田太郎（更新版）',
      emailAddress: 'yamada.new@example.com',
      phoneNumber: '09087654321',
      department: '営業部',
      jobTitle: '営業部長',
      supervisorId: null,
      status: '有効',
      currentUserId: 'user-update-001',
      operationTimestamp: '2024-06-15T14:30:00Z',
    };

    const result = await saveSalesRepresentative(input);

    expect(result.salesRepresentativeId).toBe('rep-001');
    expect(result.name).toBe('山田太郎（更新版）');
    expect(result.emailAddress).toBe('yamada.new@example.com');
    expect(result.phoneNumber).toBe('09087654321');
    expect(result.department).toBe('営業部');
    expect(result.jobTitle).toBe('営業部長');
    expect(result.supervisorId).toBeNull();
    expect(result.status).toBe('有効');
    expect(result.createdAt).toBe('2024-01-01T10:00:00Z');
    expect(result.updatedAt).toBe('2024-06-15T14:30:00Z');
    expect(result.createdBy).toBe('admin');
    expect(result.updatedBy).toBe('user-update-001');
  });
});
