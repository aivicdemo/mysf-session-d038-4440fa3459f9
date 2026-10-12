import { fetchOperationAuditLogsByUser } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-892: fetchOperationAuditLogsByUser - 複数操作履歴の降順ソート', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('複数の操作履歴が存在する場合、操作実行日時の降順で正しくソートされた順序で返される', async () => {
    const mockAuditLogs = [
      {
        operationAuditLogId: '550e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        operationType: 'CREATE',
        targetTableName: 'accounts',
        targetRecordId: '550e8400-e29b-41d4-a716-446655440010',
        changeBeforeValue: null,
        changeAfterValue: '{"name":"ABC Corp"}',
        operationDetailContent: '取引先を作成',
        ipAddress: '192.168.1.100',
        sessionId: 'sess-001',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2025-01-15T08:30:00Z',
        createdAt: '2025-01-15T08:30:05Z',
      },
      {
        operationAuditLogId: '550e8400-e29b-41d4-a716-446655440002',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        operationType: 'UPDATE',
        targetTableName: 'opportunities',
        targetRecordId: '550e8400-e29b-41d4-a716-446655440020',
        changeBeforeValue: '{"amount":100000}',
        changeAfterValue: '{"amount":120000}',
        operationDetailContent: '商談金額を更新',
        ipAddress: '192.168.1.100',
        sessionId: 'sess-001',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2025-01-15T10:15:30Z',
        createdAt: '2025-01-15T10:15:35Z',
      },
      {
        operationAuditLogId: '550e8400-e29b-41d4-a716-446655440003',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        operationType: 'DELETE',
        targetTableName: 'invoices',
        targetRecordId: '550e8400-e29b-41d4-a716-446655440030',
        changeBeforeValue: '{"status":"DRAFT"}',
        changeAfterValue: null,
        operationDetailContent: '下書き請求書を削除',
        ipAddress: '192.168.1.100',
        sessionId: 'sess-002',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2025-01-15T14:45:00Z',
        createdAt: '2025-01-15T14:45:05Z',
      },
      {
        operationAuditLogId: '550e8400-e29b-41d4-a716-446655440004',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        operationType: 'UPDATE',
        targetTableName: 'invoice_details',
        targetRecordId: '550e8400-e29b-41d4-a716-446655440040',
        changeBeforeValue: '{"quantity":10,"unit_price":5000}',
        changeAfterValue: '{"quantity":12,"unit_price":5000}',
        operationDetailContent: '請求明細の数量を修正',
        ipAddress: '192.168.1.101',
        sessionId: 'sess-003',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2025-01-15T09:20:15Z',
        createdAt: '2025-01-15T09:20:20Z',
      },
      {
        operationAuditLogId: '550e8400-e29b-41d4-a716-446655440005',
        userId: '550e8400-e29b-41d4-a716-446655440099',
        operationType: 'CREATE',
        targetTableName: 'accounts',
        targetRecordId: '550e8400-e29b-41d4-a716-446655440050',
        changeBeforeValue: null,
        changeAfterValue: '{"name":"XYZ Inc"}',
        operationDetailContent: '取引先を作成',
        ipAddress: '192.168.1.102',
        sessionId: 'sess-004',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2025-01-15T11:00:00Z',
        createdAt: '2025-01-15T11:00:05Z',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockAuditLogs);

    const result = await fetchOperationAuditLogsByUser({
      userId: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(result.operationLogs).toHaveLength(4);
    expect(result.totalCount).toBe(4);

    expect(result.operationLogs[0].operationExecutionTimestamp).toBe('2025-01-15T14:45:00Z');
    expect(result.operationLogs[0].operationType).toBe('DELETE');
    expect(result.operationLogs[0].targetTableName).toBe('invoices');

    expect(result.operationLogs[1].operationExecutionTimestamp).toBe('2025-01-15T10:15:30Z');
    expect(result.operationLogs[1].operationType).toBe('UPDATE');
    expect(result.operationLogs[1].targetTableName).toBe('opportunities');

    expect(result.operationLogs[2].operationExecutionTimestamp).toBe('2025-01-15T09:20:15Z');
    expect(result.operationLogs[2].operationType).toBe('UPDATE');
    expect(result.operationLogs[2].targetTableName).toBe('invoice_details');

    expect(result.operationLogs[3].operationExecutionTimestamp).toBe('2025-01-15T08:30:00Z');
    expect(result.operationLogs[3].operationType).toBe('CREATE');
    expect(result.operationLogs[3].targetTableName).toBe('accounts');
  });
});
