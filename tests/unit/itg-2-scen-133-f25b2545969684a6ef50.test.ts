import { mapCalculationLogicsToTargetSystem, IncompatibleCalculationLogicError } from '../../src/logic/calculation-logic-mapper';
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

describe('SCEN-133: エラー：Salesforceの計算ロジックが移行対象システムの実装方式と互換性がない場合、IncompatibleCalculationLogicErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw IncompatibleCalculationLogicError when calculation logic is incompatible with target system capabilities', async () => {
    // Setup
    const projectId = 'proj-20250107-001';
    const targetSystemId = 'oracle-erp-target-001';
    const userId = 'user-migration-admin-001';
    const executionTimestamp = new Date('2025-01-07T10:30:00.000Z');

    // Mock resolveProjectContext
    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
      targetSystemId,
      isResolved: true,
    });

    // Mock verifyUserAuthenticationAndAuthorization
    (authorizationService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      userId,
      isAuthorized: true,
    });

    // Mock analyzeReferenceRelationships
    (referenceRelationshipAnalyzer.analyzeReferenceRelationships as jest.Mock).mockResolvedValue({
      hasCircularDependency: false,
      status: 'valid',
    });

    const calculationLogics = [
      {
        calculationLogicId: 'calc-logic-001',
        logicName: 'Invoice Total with TAX',
        logicType: 'ProcessBuilder',
        targetObjectId: 'Invoice__c',
        targetFieldName: 'Total_Amount__c',
        existingSystemLogic: 'Oracle ERPの標準機能では集計トリガーと条件付きUPDATEで実装',
        salesforceLogic: 'SUM(InvoiceLineItem__r.Amount__c) + TAX_RATE * SUM(InvoiceLineItem__r.Amount__c)',
      },
      {
        calculationLogicId: 'calc-logic-002',
        logicName: 'Invoice Status by Amount',
        logicType: 'WorkflowRule',
        targetObjectId: 'Invoice__c',
        targetFieldName: 'Status__c',
        existingSystemLogic: 'Oracle ERPでは同期バッチプロセスで実装',
        salesforceLogic: "IF(Total_Amount__c > 100000, 'HighValue', 'Standard')",
      },
      {
        calculationLogicId: 'calc-logic-003',
        logicName: 'Discounted Price',
        logicType: 'CalculatedField',
        targetObjectId: 'InvoiceLineItem__c',
        targetFieldName: 'DiscountedPrice__c',
        existingSystemLogic: 'Oracle ERPの標準フィールド計算機能で実装可能',
        salesforceLogic: 'UnitPrice__c * (1 - DiscountPercent__c / 100)',
      },
    ];

    const targetSystemCapabilities = [
      {
        capabilityId: 'cap-calc-field',
        functionName: 'CalculatedField',
        functionCategory: 'calculation',
        complexityLevel: 1,
        isMappingTarget: true,
        dependentCapabilityIds: [],
      },
      {
        capabilityId: 'cap-batch-process',
        functionName: 'BatchProcess',
        functionCategory: 'automation',
        complexityLevel: 3,
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
    await expect(mapCalculationLogicsToTargetSystem(input)).rejects.toThrow(IncompatibleCalculationLogicError);
    await expect(mapCalculationLogicsToTargetSystem(input)).rejects.toThrow('このSalesforce計算ロジックは移行対象システムでは実装できません。カスタマイズが必要です。');
  });
});
