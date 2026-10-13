import { saveMappingDetails } from '../../src/logic/mapping-persistence';
import * as mappingPersistence from '../../src/logic/mapping-persistence';
import * as authAuthModule from '../../src/logic/authentication-authorization';
import * as projectContextModule from '../../src/logic/project-context-resolver';
import * as validationModule from '../../src/logic/data-validation-rules';
import { v4 as uuidv4 } from 'uuid';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/data-validation-rules');
jest.mock('../../src/platform/data-store');

describe('SCEN-141: saveMappingDetails - 正常な入力で機能マッピング詳細レコードが保存される', () => {
  let mockDataStore: any;

  beforeEach(() => {
    jest.clearAllMocks();

    const dataStoreModule = require('../../src/platform/data-store');
    mockDataStore = {
      createRecord: jest.fn().mockResolvedValue({}),
      listRecords: jest.fn().mockResolvedValue([]),
      updateRecord: jest.fn().mockResolvedValue({}),
      deleteRecord: jest.fn().mockResolvedValue({}),
    };
    dataStoreModule.dataStore = mockDataStore;
  });

  it('should save mapping details successfully and return complete record with initial status', async () => {
    const projectId = '550e8400-e29b-41d4-a716-446655440000';
    const targetSystemId = '660e8400-e29b-41d4-a716-446655440001';
    const userId = '880e8400-e29b-41d4-a716-446655440003';
    const operationTimestamp = '2026-10-07T10:30:00Z';
    const mappingDetailId = '990e8400-e29b-41d4-a716-446655440004';

    const input = {
      projectId,
      targetSystemId,
      existingFunctionName: '請求書自動生成',
      existingFunctionDescription: '商談確定時に請求書を自動生成し、請求明細を一括作成する機能',
      mappingTargetObjectId: '770e8400-e29b-41d4-a716-446655440002',
      mappingMethod: '標準機能利用',
      implementationPolicy: 'Salesforce標準のワークフロー自動化を使用して実装',
      priority: 2,
      complexity: '中',
      dependencies: '商談オブジェクト、取引先オブジェクトへの依存',
      verificationMethod: 'UAT環境での実装テスト、既存データとの突合せ',
      remarks: '既存システムでは定期実行バッチで実現していたが、Salesforceでは即座に生成される',
      userId,
      operationTimestamp,
    };

    // Mock successful authentication and authorization
    (authAuthModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthorized: true,
      userId,
    });

    // Mock successful project context resolution
    (projectContextModule.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
      targetSystemId,
      userId,
      isContextValid: true,
    });

    // Mock successful validation
    (validationModule.validateStandardFunctionMappings as jest.Mock).mockResolvedValue({
      isValid: true,
      validationResults: [],
    });

    // Mock data store to return saved record
    mockDataStore.createRecord.mockResolvedValue({
      mappingDetailId,
      projectId,
      targetSystemId,
      existingFunctionName: input.existingFunctionName,
      existingFunctionDescription: input.existingFunctionDescription,
      mappingTargetObjectId: input.mappingTargetObjectId,
      mappingMethod: input.mappingMethod,
      implementationPolicy: input.implementationPolicy,
      migrationStatus: '未開始',
      priority: input.priority,
      complexity: input.complexity,
      dependencies: input.dependencies,
      verificationMethod: input.verificationMethod,
      verificationStatus: '未検証',
      remarks: input.remarks,
      createdAt: operationTimestamp,
      createdBy: userId,
      updatedAt: operationTimestamp,
      updatedBy: userId,
    });

    const result = await saveMappingDetails(input);

    expect(result).toBeDefined();
    expect(result.mappingDetailId).toBe(mappingDetailId);
    expect(result.projectId).toBe(projectId);
    expect(result.targetSystemId).toBe(targetSystemId);
    expect(result.existingFunctionName).toBe('請求書自動生成');
    expect(result.existingFunctionDescription).toBe('商談確定時に請求書を自動生成し、請求明細を一括作成する機能');
    expect(result.mappingTargetObjectId).toBe('770e8400-e29b-41d4-a716-446655440002');
    expect(result.mappingMethod).toBe('標準機能利用');
    expect(result.implementationPolicy).toBe('Salesforce標準のワークフロー自動化を使用して実装');
    expect(result.migrationStatus).toBe('未開始');
    expect(result.priority).toBe(2);
    expect(result.complexity).toBe('中');
    expect(result.dependencies).toBe('商談オブジェクト、取引先オブジェクトへの依存');
    expect(result.verificationMethod).toBe('UAT環境での実装テスト、既存データとの突合せ');
    expect(result.verificationStatus).toBe('未検証');
    expect(result.remarks).toBe('既存システムでは定期実行バッチで実現していたが、Salesforceでは即座に生成される');
    expect(result.createdAt).toBe(operationTimestamp);
    expect(result.createdBy).toBe(userId);
    expect(result.updatedAt).toBe(operationTimestamp);
    expect(result.updatedBy).toBe(userId);

    expect(authAuthModule.verifyUserAuthenticationAndAuthorization).toHaveBeenCalled();
    expect(projectContextModule.resolveProjectContext).toHaveBeenCalled();
    expect(validationModule.validateStandardFunctionMappings).toHaveBeenCalled();
  });
});
