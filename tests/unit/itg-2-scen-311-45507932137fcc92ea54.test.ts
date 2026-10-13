import { recordReferenceVisualizationAuditTrail, DataPersistenceError } from '../../src/logic/audit-trail-service';
import { DataStoreError } from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/mapping-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-persistence')>('../../src/logic/mapping-persistence'),
  recordOperationAuditTrail: jest.fn(),
}));

import * as mappingPersistence from '../../src/logic/mapping-persistence';

describe('SCEN-311: recordReferenceVisualizationAuditTrail - recordOperationAuditTrail throws DataStoreError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataPersistenceError when recordOperationAuditTrail throws DataStoreError', async () => {
    (mappingPersistence.recordOperationAuditTrail as jest.Mock).mockRejectedValueOnce(
      new DataStoreError('Database connection failed')
    );

    const input = {
      userId: 'user-001',
      projectId: 'proj-migration-2026',
      targetObjectId: 'Invoice__c',
      visualizationResult: {
        nodes: [
          { objectId: 'Invoice__c', objectName: '請求書' },
          { objectId: 'InvoiceLineItem__c', objectName: '請求明細' },
        ],
        edges: [
          {
            source: 'Invoice__c',
            target: 'InvoiceLineItem__c',
            relationshipType: 'master-detail',
          },
        ],
      },
      executionResultStatus: 'success',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'session-abc123',
      operationExecutedAt: new Date('2026-10-07T14:30:00Z'),
    };

    await expect(recordReferenceVisualizationAuditTrail(input)).rejects.toThrow(DataPersistenceError);
    await expect(recordReferenceVisualizationAuditTrail(input)).rejects.toThrow(
      '操作履歴の保存に失敗しました。システム管理者に連絡してください。'
    );
  });
});
