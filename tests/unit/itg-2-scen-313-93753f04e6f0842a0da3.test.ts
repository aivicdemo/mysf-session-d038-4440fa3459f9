import { recordReferenceVisualizationAuditTrail } from '../../src/logic/audit-trail-service';
import * as mappingPersistence from '../../src/logic/mapping-persistence';
import type { OperationAuditTrailRecord } from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/mapping-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-persistence')>('../../src/logic/mapping-persistence'),
  recordOperationAuditTrail: jest.fn(),
}));

describe('SCEN-313: recordReferenceVisualizationAuditTrail - success case with null error message', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return OperationAuditTrailRecord with undefined errorMessage when operation succeeds', async () => {
    const input = {
      userId: 'user-12345',
      projectId: 'proj-67890',
      targetObjectId: 'obj-invoice-custom',
      visualizationResult: {
        referenceGraph: {
          nodes: [
            { objectId: 'obj-invoice-custom', objectName: 'Invoice__c' },
            { objectId: 'obj-invoice-line-custom', objectName: 'InvoiceLine__c' },
          ],
          edges: [
            {
              from: 'obj-invoice-custom',
              to: 'obj-invoice-line-custom',
              relationshipType: 'master-detail',
            },
          ],
        },
        circularyDependencies: [],
        targetSystemCompatibility: {
          oracleCompatible: true,
          mappingStatus: 'compatible',
        },
      },
      executionResultStatus: 'SUCCESS',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'session-abc-def-ghi',
      operationExecutedAt: new Date('2026-10-15T14:30:00Z'),
    };

    const expectedResult: OperationAuditTrailRecord = {
      auditTrailId: 'audit-trail-001',
      userId: 'user-12345',
      operationType: 'REFERENCE_VISUALIZATION',
      targetTableName: 'reference_visualization_audit',
      targetRecordId: 'obj-invoice-custom',
      operationDetails: 'Reference visualization executed for Invoice__c custom object',
      ipAddress: '192.168.1.100',
      sessionId: 'session-abc-def-ghi',
      operationStatus: 'SUCCESS',
      errorMessage: undefined,
      operationTimestamp: '2026-10-15T14:30:00Z',
      createdAt: '2026-10-15T14:30:00Z',
    };

    (mappingPersistence.recordOperationAuditTrail as jest.Mock).mockResolvedValue(expectedResult);

    const result = await recordReferenceVisualizationAuditTrail(input);

    expect(result).toEqual(expectedResult);
    expect(result.errorMessage).toBeUndefined();
    expect(result.operationStatus).toBe('SUCCESS');
    expect(result.operationTimestamp).toBe('2026-10-15T14:30:00Z');
    expect(result.userId).toBe('user-12345');
    expect(result.targetRecordId).toBe('obj-invoice-custom');
    expect(result.ipAddress).toBe('192.168.1.100');
    expect(result.sessionId).toBe('session-abc-def-ghi');
    expect(result.operationType).toBe('REFERENCE_VISUALIZATION');
    expect(result.targetTableName).toBe('reference_visualization_audit');
  });
});
