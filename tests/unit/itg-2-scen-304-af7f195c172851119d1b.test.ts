import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  recordReferenceVisualizationAuditTrail,
  InvalidUserIdError,
} from '../../src/logic/audit-trail-service';
import * as mappingPersistence from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/mapping-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-persistence')>('../../src/logic/mapping-persistence'),
  recordOperationAuditTrail: jest.fn(),
}));

describe('SCEN-304: 参照関係可視化操作の監査証跡記録（エラー系: ユーザーID無効）', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ユーザーIDが空文字列またはnullのとき、InvalidUserIdErrorが発生する', async () => {
    const input = {
      userId: null as any,
      projectId: 'proj-20260107-001',
      targetObjectId: 'obj-invoice-custom',
      visualizationResult: {
        referenceGraph: {
          nodes: ['Invoice__c', 'InvoiceLineItem__c'],
          edges: [{ from: 'Invoice__c', to: 'InvoiceLineItem__c', type: 'master-detail' }],
        },
        circularDependencies: [],
        targetSystemCompatibility: { compatible: true, gaps: [] },
      },
      executionResultStatus: 'SUCCESS',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'session-abc123xyz789',
      operationExecutedAt: new Date('2026-01-07T10:30:45.000Z'),
    };

    await expect(recordReferenceVisualizationAuditTrail(input)).rejects.toThrow(InvalidUserIdError);
    expect(mappingPersistence.recordOperationAuditTrail).not.toHaveBeenCalled();
  });
});
