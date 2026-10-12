import { saveActivity } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  createRecord: jest.fn()
}));

describe('SCEN-729: 新規作成時、次回フォローアップ予定日が指定されない場合、当該フィールドはnullで保存され結果に反映される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('SaveActivityOutput の nextFollowUpScheduledDate フィールドが null で返却される', async () => {
    const mockListRecords = jest.mocked(dataStore.listRecords);
    const mockCreateRecord = jest.mocked(dataStore.createRecord);

    mockListRecords
      .mockResolvedValueOnce([{ id: 'cust-uuid-001', customerId: 'cust-uuid-001', status: 'valid', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' }])
      .mockResolvedValueOnce([{ id: 'sales-uuid-001', salesRepresentativeId: 'sales-uuid-001', status: 'valid', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' }])
      .mockResolvedValueOnce([{ id: 'acttype-uuid-001', activityTypeName: '訪問', validFlag: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' }])
      .mockResolvedValueOnce([{ id: 'actresult-uuid-001', activityResultName: '成功', validFlag: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' }])
      .mockResolvedValueOnce([{ id: 'actfreq-uuid-001', activityFrequencyName: '初回', validFlag: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' }])
      .mockResolvedValueOnce([]);

    const generatedId = 'activity-' + Math.random().toString(36).substr(2, 9);

    mockCreateRecord.mockResolvedValueOnce({
      id: generatedId,
      activityId: generatedId,
      customerId: 'cust-uuid-001',
      salesRepresentativeId: 'sales-uuid-001',
      activityType: '訪問',
      activityDateTime: '2024-01-15T10:30:00Z',
      activityContent: '顧客訪問にて新製品の説明を実施',
      nextFollowUpScheduledDate: null,
      dealId: null,
      estimatedAmount: null,
      contractedFlag: false,
      activityDurationMinutes: 60,
      activityCount: 1,
      activityFrequency: '初回',
      activityResult: '成功',
      nextAction: null,
      createdAt: '2024-01-15T10:35:00Z',
      updatedAt: '2024-01-15T10:35:00Z',
      createdBy: 'user-uuid-001'
    });

    const result = await saveActivity({
      activityId: null,
      customerId: 'cust-uuid-001',
      salesRepresentativeId: 'sales-uuid-001',
      activityType: '訪問',
      activityDateTime: '2024-01-15T10:30:00Z',
      activityContent: '顧客訪問にて新製品の説明を実施',
      nextFollowUpScheduledDate: null,
      dealId: null,
      estimatedAmount: null,
      contractedFlag: false,
      activityDurationMinutes: 60,
      activityCount: 1,
      activityFrequency: '初回',
      activityResult: '成功',
      nextAction: null,
      currentUserId: 'user-uuid-001',
      operationTimestamp: '2024-01-15T10:35:00Z'
    });

    expect(result.nextFollowUpScheduledDate).toBeNull();
    expect(result.activityId).toBeTruthy();
    expect(result.customerId).toBe('cust-uuid-001');
    expect(result.salesRepresentativeId).toBe('sales-uuid-001');
    expect(result.activityType).toBe('訪問');
    expect(result.activityDateTime).toBe('2024-01-15T10:30:00Z');
    expect(result.activityContent).toBe('顧客訪問にて新製品の説明を実施');
    expect(result.dealId).toBeNull();
    expect(result.estimatedAmount).toBeNull();
    expect(result.contractedFlag).toBe(false);
    expect(result.activityDurationMinutes).toBe(60);
    expect(result.activityCount).toBe(1);
    expect(result.activityFrequency).toBe('初回');
    expect(result.activityResult).toBe('成功');
    expect(result.nextAction).toBeNull();
    expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(result.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(result.createdBy).toBe('user-uuid-001');
  });
});
