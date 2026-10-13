import { recordReferenceVisualizationAuditTrail, InvalidVisualizationResultError } from '../../src/logic/audit-trail-service';

jest.mock('../../src/logic/mapping-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-persistence')>('../../src/logic/mapping-persistence'),
  recordOperationAuditTrail: jest.fn(),
}));

import * as mappingPersistence from '../../src/logic/mapping-persistence';

describe('SCEN-310: recordReferenceVisualizationAuditTrail - invalid visualizationResult error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidVisualizationResultError when visualizationResult is null', async () => {
    const input = {
      userId: 'user-001',
      projectId: 'proj-migration-2025',
      targetObjectId: 'custom-obj-invoice',
      visualizationResult: null,
      executionResultStatus: 'FAILURE',
      errorMessage: '参照グラフ構築に失敗しました',
      ipAddress: '192.168.1.100',
      sessionId: 'sess-abc123def456',
      operationExecutedAt: new Date('2025-01-15T10:30:00Z'),
    };

    await expect(recordReferenceVisualizationAuditTrail(input)).rejects.toThrow(InvalidVisualizationResultError);
    await expect(recordReferenceVisualizationAuditTrail(input)).rejects.toThrow(
      '可視化結果の形式が不正です。操作履歴の記録に失敗しました。'
    );

    expect(mappingPersistence.recordOperationAuditTrail).not.toHaveBeenCalled();
  });
});
