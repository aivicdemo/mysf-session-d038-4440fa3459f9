import { mapCalculationLogicsToTargetSystem, CircularDependencyDetectedError } from '../../src/logic/calculation-logic-mapper';
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

describe('SCEN-132: エラー：計算ロジック間に循環依存が存在する場合、CircularDependencyDetectedErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw CircularDependencyDetectedError when circular dependency is detected', async () => {
    // Setup
    const projectId = 'proj-20250107-001';
    const targetSystemId = 'oracle-erp-v12';
    const userId = 'user-migration-lead-001';
    const executionTimestamp = new Date('2025-01-07T10:30:00Z');

    // Mock resolveProjectContext
    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
      targetSystemId,
    });

    // Mock verifyUserAuthenticationAndAuthorization
    (authorizationService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      userId,
      permissions: ['mapping:execute'],
    });

    // Mock analyzeReferenceRelationships
    (referenceRelationshipAnalyzer.analyzeReferenceRelationships as jest.Mock).mockResolvedValue({
      dependencyGraph: {
        'calc-logic-001': ['calc-logic-002'],
        'calc-logic-002': ['calc-logic-001'],
      },
      hasCircularDependency: true,
      circularDependencyPath: ['calc-logic-001', 'calc-logic-002', 'calc-logic-001'],
    });

    const calculationLogics = [
      {
        calculationLogicId: 'calc-logic-001',
        logicName: 'Invoice Total Amount',
        logicType: 'FieldCalculation',
        targetObjectId: 'Invoice__c',
        targetFieldName: 'TotalAmount__c',
        existingSystemLogic: 'SUM(InvoiceLineItem.Amount)',
        salesforceLogic: '{InvoiceLineItem__r.Amount__c}',
        referenceFieldList: ['InvoiceLineItem__c'],
        dependentLogicIds: ['calc-logic-002'],
      },
      {
        calculationLogicId: 'calc-logic-002',
        logicName: 'Invoice Line Item Amount',
        logicType: 'FieldCalculation',
        targetObjectId: 'InvoiceLineItem__c',
        targetFieldName: 'Amount__c',
        existingSystemLogic: 'Quantity * UnitPrice',
        salesforceLogic: '{Quantity__c} * {UnitPrice__c}',
        dependentLogicIds: ['calc-logic-001'],
      },
    ];

    const targetSystemCapabilities = [
      {
        capabilityId: 'cap-calc-001',
        functionName: 'FieldCalculation',
        functionCategory: 'calculation',
        complexityLevel: 2,
        isMappingTarget: true,
        dependentCapabilityIds: [],
      },
    ];

    const input: MapCalculationLogicsToTargetSystemInput = {
      projectId,
      targetSystemId,
      userId,
      calculationLogics,
      targetSystemCapabilities,
      executionTimestamp,
    };

    // Execute and verify
    await expect(mapCalculationLogicsToTargetSystem(input)).rejects.toThrow(CircularDependencyDetectedError);
    await expect(mapCalculationLogicsToTargetSystem(input)).rejects.toThrow('計算ロジック間に循環依存が検出されました。移行対象システムでは実装できません。');
  });
});
