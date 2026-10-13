import { recordReferenceVisualizationAuditTrail, InvalidTargetObjectIdError } from '../../src/logic/audit-trail-service';

jest.mock('../../src/logic/mapping-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-persistence')>('../../src/logic/mapping-persistence'),
  recordOperationAuditTrail: jest.fn(),
}));

import * as mappingPersistence from '../../src/logic/mapping-persistence';

describe('SCEN-306: recordReferenceVisualizationAuditTrail - empty targetObjectId error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidTargetObjectIdError when targetObjectId is empty string', async () => {
    const input = {
      userId: 'user-123',
      projectId: 'proj-456',
      targetObjectId: '', // empty string
      visualizationResult: {
        referenceGraph: {
          nodes: ['Invoice__c', 'InvoiceLineItem__c'],
          edges: [{ from: 'Invoice__c', to: 'InvoiceLineItem__c' }],
        },
        circularDependencies: [],
        targetSystemCompatibility: {
          compatible: true,
          gaps: [],
        },
      },
      executionResultStatus: 'success',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'session-789',
      operationExecutedAt: new Date('2026-10-07T10:30:00.000Z'),
    };

    await expect(recordReferenceVisualizationAuditTrail(input)).rejects.toThrow(InvalidTargetObjectIdError);
    await expect(recordReferenceVisualizationAuditTrail(input)).rejects.toThrow(
      '可視化対象オブジェクトIDが指定されていません。操作履歴の記録に失敗しました。'
    );

    expect(mappingPersistence.recordOperationAuditTrail).not.toHaveBeenCalled();
  });

  it('should throw InvalidTargetObjectIdError when targetObjectId is null', async () => {
    const input = {
      userId: 'user-123',
      projectId: 'proj-456',
      targetObjectId: null as any,
      visualizationResult: {
        referenceGraph: {
          nodes: ['Invoice__c', 'InvoiceLineItem__c'],
          edges: [{ from: 'Invoice__c', to: 'InvoiceLineItem__c' }],
        },
        circularDependencies: [],
        targetSystemCompatibility: {
          compatible: true,
          gaps: [],
        },
      },
      executionResultStatus: 'success',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'session-789',
      operationExecutedAt: new Date('2026-10-07T10:30:00.000Z'),
    };

    await expect(recordReferenceVisualizationAuditTrail(input)).rejects.toThrow(InvalidTargetObjectIdError);
  });
});
