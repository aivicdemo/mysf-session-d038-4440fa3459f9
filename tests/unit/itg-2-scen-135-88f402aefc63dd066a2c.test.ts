import { mapCalculationLogicsToTargetSystem, TargetSystemCapabilitiesNotProvidedError } from '../../src/logic/calculation-logic-mapper';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as authorizationService from '../../src/logic/authentication-authorization';
import * as referenceRelationshipAnalyzer from '../../src/logic/reference-relationship-analyzer';
import type { MapCalculationLogicsToTargetSystemInput } from '../../src/logic/calculation-logic-mapper';

jest.mock('../../src/logic/project-context-resolver', () => ({
  ...jest.requireActual<typeof import('../../src/logic/project-context-resolver')>('../../src/logic/project-context-resolver'),
  resolveProjectContext: jest.fn(),
}));

jest.mock('../../src/logic/authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/authentication-authorization')>('../../src/logic/authentication-authorization'),
  verifyUserAuthenticationAndAuthorization: jest.fn(),
}));

jest.mock('../../src/logic/reference-relationship-analyzer', () => ({
  ...jest.requireActual<typeof import('../../src/logic/reference-relationship-analyzer')>('../../src/logic/reference-relationship-analyzer'),
  analyzeReferenceRelationships: jest.fn(),
}));

describe('SCEN-135: 境界値：移行対象システム実装方式の配列が空の場合、TargetSystemCapabilitiesNotProvidedErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw TargetSystemCapabilitiesNotProvidedError when target system capabilities array is empty', async () => {
    // Setup
    const projectId = 'proj-001';
    const targetSystemId = 'oracle-erp-001';
    const userId = 'user-12345';
    const executionTimestamp = new Date('2026-10-15T10:30:00.000Z');

    // Mock resolveProjectContext
    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
      targetSystemId,
      projectName: 'Salesforce to Oracle Migration',
      contextResolved: true,
    });

    // Mock verifyUserAuthenticationAndAuthorization
    (authorizationService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      userId,
      isAuthorized: true,
      permissions: ['mapping:execute', 'mapping:view'],
    });

    // Mock analyzeReferenceRelationships
    (referenceRelationshipAnalyzer.analyzeReferenceRelationships as jest.Mock).mockResolvedValue({
      dependencies: [],
      circularDependenciesDetected: false,
    });

    const calculationLogics = [
      {
        calculationLogicId: 'calc-001',
        logicName: 'Invoice Total Amount',
        logicType: 'FieldFormula',
        targetObjectId: 'Invoice__c',
        targetFieldName: 'TotalAmount__c',
        existingSystemLogic: '請求明細の合計金額計算',
        salesforceLogic: 'SUM(Invoice_Line_Items__r.Amount__c)',
      },
    ];

    const targetSystemCapabilities: any[] = [];

    const input: MapCalculationLogicsToTargetSystemInput = {
      projectId,
      targetSystemId,
      userId,
      calculationLogics,
      targetSystemCapabilities,
      executionTimestamp,
    };

    // Execute and verify
    await expect(mapCalculationLogicsToTargetSystem(input)).rejects.toThrow(TargetSystemCapabilitiesNotProvidedError);
    await expect(mapCalculationLogicsToTargetSystem(input)).rejects.toThrow('移行対象システムの計算ロジック実装方式を指定してください。');
  });
});
