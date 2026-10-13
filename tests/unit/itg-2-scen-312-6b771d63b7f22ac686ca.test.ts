import { recordReferenceVisualizationAuditTrail } from '../../src/logic/audit-trail-service';
import type { OperationAuditTrailRecord } from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/mapping-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-persistence')>('../../src/logic/mapping-persistence'),
  recordOperationAuditTrail: jest.fn(),
}));

import * as mappingPersistence from '../../src/logic/mapping-persistence';

describe('SCEN-312: recordReferenceVisualizationAuditTrail - normal case with failure status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should record failure status with error message in audit trail', async () => {
    const mockAuditTrailRecord: OperationAuditTrailRecord = {
      auditTrailId: 'audit-20261007-143045-001',
      userId: 'user-12345',
      operationType: 'REFERENCE_VISUALIZATION',
      targetTableName: 'audit_trail_reference_visualization',
      targetRecordId: 'obj-invoice-custom',
      operationStatus: 'failure',
      errorMessage: '参照グラフの構築に失敗しました。循環依存の検出処理でタイムアウトが発生しました。',
      operationTimestamp: '2026-10-07T14:30:45.000Z',
      createdAt: '2026-10-07T14:30:45.000Z',
      ipAddress: '192.168.1.100',
      sessionId: 'session-abc-def-ghi',
      operationDetails: JSON.stringify({
        nodes: ['Invoice__c', 'InvoiceLineItem__c'],
        edges: [{ from: 'Invoice__c', to: 'InvoiceLineItem__c' }],
        circularDependencyDetectionResult: [],
        targetSystemCompatibilityEvaluation: {
          compatibility: 'partial',
          gaps: ['field-mapping-gap-001'],
        },
      }),
    };

    (mappingPersistence.recordOperationAuditTrail as jest.Mock).mockResolvedValueOnce(mockAuditTrailRecord);

    const input = {
      userId: 'user-12345',
      projectId: 'proj-67890',
      targetObjectId: 'obj-invoice-custom',
      visualizationResult: {
        nodes: ['Invoice__c', 'InvoiceLineItem__c'],
        edges: [{ from: 'Invoice__c', to: 'InvoiceLineItem__c' }],
        circularDependencyDetectionResult: [],
        targetSystemCompatibilityEvaluation: {
          compatibility: 'partial',
          gaps: ['field-mapping-gap-001'],
        },
      },
      executionResultStatus: 'failure',
      errorMessage: '参照グラフの構築に失敗しました。循環依存の検出処理でタイムアウトが発生しました。',
      ipAddress: '192.168.1.100',
      sessionId: 'session-abc-def-ghi',
      operationExecutedAt: new Date('2026-10-07T14:30:45.000Z'),
    };

    const result = await recordReferenceVisualizationAuditTrail(input);

    expect(result.auditTrailId).toBe('audit-20261007-143045-001');
    expect(result.userId).toBe('user-12345');
    expect(result.operationType).toBe('REFERENCE_VISUALIZATION');
    expect(result.targetTableName).toBe('audit_trail_reference_visualization');
    expect(result.targetRecordId).toBe('obj-invoice-custom');
    expect(result.operationStatus).toBe('failure');
    expect(result.errorMessage).toBe('参照グラフの構築に失敗しました。循環依存の検出処理でタイムアウトが発生しました。');
    expect(result.operationTimestamp).toBe('2026-10-07T14:30:45.000Z');
    expect(result.createdAt).toBe('2026-10-07T14:30:45.000Z');

    const expectedOperationDetails = {
      nodes: ['Invoice__c', 'InvoiceLineItem__c'],
      edges: [{ from: 'Invoice__c', to: 'InvoiceLineItem__c' }],
      circularDependencyDetectionResult: [],
      targetSystemCompatibilityEvaluation: {
        compatibility: 'partial',
        gaps: ['field-mapping-gap-001'],
      },
    };
    if (result.operationDetails) {
      const parsedDetails = JSON.parse(result.operationDetails);
      expect(parsedDetails).toEqual(expectedOperationDetails);
    }

    expect(mappingPersistence.recordOperationAuditTrail).toHaveBeenCalled();
  });
});
