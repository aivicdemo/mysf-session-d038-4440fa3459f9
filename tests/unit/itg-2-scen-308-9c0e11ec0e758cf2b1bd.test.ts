import { recordReferenceVisualizationAuditTrail, InvalidIpAddressError } from '../../src/logic/audit-trail-service';

jest.mock('../../src/logic/mapping-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-persistence')>('../../src/logic/mapping-persistence'),
  recordOperationAuditTrail: jest.fn(),
}));

import * as mappingPersistence from '../../src/logic/mapping-persistence';

describe('SCEN-308: recordReferenceVisualizationAuditTrail - empty ipAddress error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidIpAddressError when ipAddress is empty string', async () => {
    const input = {
      userId: 'user-123',
      projectId: 'proj-456',
      targetObjectId: 'obj-789',
      visualizationResult: {
        nodes: [{ objectId: 'obj-789', objectName: 'Invoice__c' }],
        edges: [],
      },
      executionResultStatus: 'SUCCESS',
      errorMessage: null,
      ipAddress: '', // empty string
      sessionId: 'session-xyz',
      operationExecutedAt: new Date('2026-01-15T10:30:00.000Z'),
    };

    await expect(recordReferenceVisualizationAuditTrail(input)).rejects.toThrow(InvalidIpAddressError);
    await expect(recordReferenceVisualizationAuditTrail(input)).rejects.toThrow(
      'IPアドレスが指定されていません。操作履歴の記録に失敗しました。'
    );

    expect(mappingPersistence.recordOperationAuditTrail).not.toHaveBeenCalled();
  });
});
