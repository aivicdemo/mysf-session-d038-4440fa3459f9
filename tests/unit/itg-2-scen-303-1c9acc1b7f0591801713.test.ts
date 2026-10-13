import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { recordReferenceVisualizationAuditTrail } from '../../src/logic/audit-trail-service';
import * as mappingPersistence from '../../src/logic/mapping-persistence';
import type { OperationAuditTrailRecord } from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/mapping-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-persistence')>('../../src/logic/mapping-persistence'),
  recordOperationAuditTrail: jest.fn(),
}));

const mockRecordOperationAuditTrail = mappingPersistence.recordOperationAuditTrail as jest.Mock;

describe('SCEN-303: 参照関係可視化操作の監査証跡記録（正常系）', () => {
  beforeEach(() => {
    mockRecordOperationAuditTrail.mockClear();
  });

  it('すべての必須入力が有効でrecordOperationAuditTrailが成功するとき、監査証跡レコードが作成される', async () => {
    const mockAuditTrailRecord: OperationAuditTrailRecord = {
      auditTrailId: 'audit-rec-20261015-001',
      userId: 'user-12345',
      operationType: 'REFERENCE_VISUALIZATION',
      targetTableName: 'OperationAuditTrail',
      targetRecordId: 'Invoice__c',
      changeBeforeValue: undefined,
      changeAfterValue: undefined,
      operationDetails:
        '参照関係可視化操作を実行。参照グラフ構築完了、循環依存なし、Oracle互換性：COMPATIBLE',
      ipAddress: '192.168.1.100',
      sessionId: 'sess-abc123xyz789',
      operationStatus: 'SUCCESS',
      errorMessage: undefined,
      operationTimestamp: '2026-10-15T14:30:45.000Z',
      createdAt: '2026-10-15T14:30:45.000Z',
    };

    (mockRecordOperationAuditTrail as any).mockResolvedValue(
      mockAuditTrailRecord
    );

    const input: any = {
      userId: 'user-12345',
      projectId: 'proj-67890',
      targetObjectId: 'Invoice__c',
      visualizationResult: {
        referenceGraph: {
          nodes: [
            { objectId: 'Invoice__c', objectName: '請求書' },
            { objectId: 'InvoiceLineItem__c', objectName: '請求明細' },
            { objectId: 'Account', objectName: '取引先' },
          ],
          edges: [
            { source: 'Invoice__c', target: 'Account', relationshipType: 'lookup' },
            { source: 'Invoice__c', target: 'InvoiceLineItem__c', relationshipType: 'masterDetail' },
          ],
        },
        circularyDependencies: [],
        targetSystemCompatibilityEvaluation: {
          oracleCompatibility: 'COMPATIBLE',
          mappingGaps: [],
        },
      },
      executionResultStatus: 'SUCCESS',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'sess-abc123xyz789',
      operationExecutedAt: new Date('2026-10-15T14:30:45.000Z'),
    };

    const result = await recordReferenceVisualizationAuditTrail(input);

    expect(result.auditTrailId).toBe('audit-rec-20261015-001');
    expect(result.userId).toBe('user-12345');
    expect(result.operationType).toBe('REFERENCE_VISUALIZATION');
    expect(result.targetTableName).toBe('OperationAuditTrail');
    expect(result.targetRecordId).toBe('Invoice__c');
    expect(result.ipAddress).toBe('192.168.1.100');
    expect(result.sessionId).toBe('sess-abc123xyz789');
    expect(result.operationStatus).toBe('SUCCESS');
    expect(result.errorMessage).toBeUndefined();
    expect(result.operationTimestamp).toBe('2026-10-15T14:30:45.000Z');
    expect(result.createdAt).toBe('2026-10-15T14:30:45.000Z');
    expect(result.operationDetails).toContain('参照グラフ構築完了');
    expect(result.operationDetails).toContain('循環依存なし');
    expect(result.operationDetails).toContain('Oracle互換性：COMPATIBLE');
  });
});
