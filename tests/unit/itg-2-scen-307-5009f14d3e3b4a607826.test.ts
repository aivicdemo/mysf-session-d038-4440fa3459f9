import { recordReferenceVisualizationAuditTrail, InvalidSessionIdError } from '../../src/logic/audit-trail-service';

jest.mock('../../src/logic/mapping-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-persistence')>('../../src/logic/mapping-persistence'),
  recordOperationAuditTrail: jest.fn(),
}));

import * as mappingPersistence from '../../src/logic/mapping-persistence';

describe('SCEN-307: recordReferenceVisualizationAuditTrail - empty sessionId error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidSessionIdError when sessionId is empty string', async () => {
    const input = {
      userId: 'user-001',
      projectId: 'proj-migration-2026',
      targetObjectId: 'obj-invoice-custom',
      visualizationResult: {
        referenceGraph: {
          nodes: [
            { objectId: 'obj-invoice-custom', objectName: 'Invoice__c' },
            { objectId: 'obj-invoice-line-custom', objectName: 'InvoiceLine__c' },
          ],
          edges: [
            {
              sourceId: 'obj-invoice-line-custom',
              targetId: 'obj-invoice-custom',
              relationshipType: 'master-detail',
            },
          ],
        },
        circularDependencies: [],
        targetSystemCompatibility: {
          oracleCompatibility: 'high',
          sapCompatibility: 'medium',
        },
      },
      executionResultStatus: 'success',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: '', // empty string
      operationExecutedAt: new Date('2026-10-07T10:30:45.123Z'),
    };

    await expect(recordReferenceVisualizationAuditTrail(input)).rejects.toThrow(InvalidSessionIdError);
    await expect(recordReferenceVisualizationAuditTrail(input)).rejects.toThrow(
      'セッションIDが指定されていません。操作履歴の記録に失敗しました。'
    );

    expect(mappingPersistence.recordOperationAuditTrail).not.toHaveBeenCalled();
  });
});
