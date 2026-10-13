import { recordReferenceVisualizationAuditTrail, InvalidExecutionResultStatusError } from '../../src/logic/audit-trail-service';

jest.mock('../../src/logic/mapping-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-persistence')>('../../src/logic/mapping-persistence'),
  recordOperationAuditTrail: jest.fn(),
}));

import * as mappingPersistence from '../../src/logic/mapping-persistence';

describe('SCEN-309: recordReferenceVisualizationAuditTrail - empty executionResultStatus error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidExecutionResultStatusError when executionResultStatus is empty string', async () => {
    const input = {
      userId: 'user-123',
      projectId: 'proj-456',
      targetObjectId: 'obj-789',
      visualizationResult: {
        nodes: [{ objectId: 'obj-789', objectName: 'Invoice__c' }],
        edges: [],
        compatibility: { compatible: true, gaps: [] },
      },
      executionResultStatus: '', // empty string
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'sess-abc123',
      operationExecutedAt: new Date('2026-01-15T10:30:00Z'),
    };

    await expect(recordReferenceVisualizationAuditTrail(input)).rejects.toThrow(InvalidExecutionResultStatusError);
    await expect(recordReferenceVisualizationAuditTrail(input)).rejects.toThrow(
      '操作実行ステータスが指定されていません。操作履歴の記録に失敗しました。'
    );

    expect(mappingPersistence.recordOperationAuditTrail).not.toHaveBeenCalled();
  });
});
