import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  recordReferenceVisualizationAuditTrail,
  InvalidProjectIdError,
} from '../../src/logic/audit-trail-service';
import * as mappingPersistence from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/mapping-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-persistence')>('../../src/logic/mapping-persistence'),
  recordOperationAuditTrail: jest.fn(),
}));

describe('SCEN-305: 参照関係可視化操作の監査証跡記録（エラー系: プロジェクトID無効）', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('プロジェクトIDが空文字列またはnullのとき、InvalidProjectIdErrorが発生する', async () => {
    const input = {
      userId: 'user-001',
      projectId: '',
      targetObjectId: 'obj-invoice-001',
      visualizationResult: {
        referenceGraph: {
          nodes: [{ objectId: 'obj-invoice-001', objectName: 'Invoice__c' }],
          edges: [],
        },
        cyclicDependencies: [],
        targetSystemCompatibility: { status: 'compatible', gaps: [] },
      },
      executionResultStatus: 'SUCCESS',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'sess-abc123def456',
      operationExecutedAt: new Date('2026-10-07T10:30:00Z'),
    };

    await expect(recordReferenceVisualizationAuditTrail(input)).rejects.toThrow(
      InvalidProjectIdError
    );
    expect(mappingPersistence.recordOperationAuditTrail).not.toHaveBeenCalled();
  });
});
