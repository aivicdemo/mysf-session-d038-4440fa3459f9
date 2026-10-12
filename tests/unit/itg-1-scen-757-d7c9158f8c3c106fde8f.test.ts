import { saveSalesRepresentative } from '../../src/logic/data-persistence';
import type { SaveSalesRepresentativeInput, SaveSalesRepresentativeOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-757: saveSalesRepresentative - 新規作成時のcreatedBy・updatedBy検証', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('新規作成時にcreatedByが操作ユーザーIDで、updatedByがnullで記録される', async () => {
    const mockOutput: SaveSalesRepresentativeOutput = {
      salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440001',
      name: '田中太郎',
      emailAddress: 'tanaka.taro@example.com',
      phoneNumber: '09012345678',
      department: '営業部',
      jobTitle: '営業課長',
      supervisorId: null,
      status: '有効',
      createdAt: '2026-10-07T10:30:00Z',
      updatedAt: '2026-10-07T10:30:00Z',
      createdBy: 'user-001',
      updatedBy: null,
    };

    (dataStore.createRecord as jest.Mock).mockResolvedValue(mockOutput);

    const input: SaveSalesRepresentativeInput = {
      salesRepresentativeId: null,
      name: '田中太郎',
      emailAddress: 'tanaka.taro@example.com',
      phoneNumber: '09012345678',
      department: '営業部',
      jobTitle: '営業課長',
      supervisorId: null,
      status: '有効',
      currentUserId: 'user-001',
      operationTimestamp: '2026-10-07T10:30:00Z',
    };

    const result = await saveSalesRepresentative(input);

    expect(result.salesRepresentativeId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(result.name).toBe('田中太郎');
    expect(result.emailAddress).toBe('tanaka.taro@example.com');
    expect(result.phoneNumber).toBe('09012345678');
    expect(result.department).toBe('営業部');
    expect(result.jobTitle).toBe('営業課長');
    expect(result.supervisorId).toBeNull();
    expect(result.status).toBe('有効');
    expect(result.createdAt).toBe('2026-10-07T10:30:00Z');
    expect(result.updatedAt).toBe('2026-10-07T10:30:00Z');
    expect(result.createdBy).toBe('user-001');
    expect(result.updatedBy).toBeNull();
  });
});
