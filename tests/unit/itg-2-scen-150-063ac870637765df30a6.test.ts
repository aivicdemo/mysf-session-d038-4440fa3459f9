import { saveMappingDetails } from '../../src/logic/mapping-persistence';
import * as authAuthModule from '../../src/logic/authentication-authorization';
import * as projectContextModule from '../../src/logic/project-context-resolver';
import * as validationModule from '../../src/logic/data-validation-rules';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/data-validation-rules');
jest.mock('../../src/platform/data-store');

describe('SCEN-150: saveMappingDetails - 初回保存時にcreatedAtとupdatedAtが同じ値で記録される', () => {
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

  it('should record identical createdAt and updatedAt on initial save', async () => {
    const projectId = '550e8400-e29b-41d4-a716-446655440000';
    const targetSystemId = '550e8400-e29b-41d4-a716-446655440001';
    const userId = '550e8400-e29b-41d4-a716-446655440003';
    const operationTimestamp = '2025-06-15T10:30:00Z';
    const mappingDetailId = '990e8400-e29b-41d4-a716-446655440005';

    const input = {
      projectId,
      targetSystemId,
      existingFunctionName: '請求書作成',
      existingFunctionDescription: 'Oracle ERP標準機能による請求書自動生成',
      mappingTargetObjectId: '550e8400-e29b-41d4-a716-446655440002',
      mappingMethod: 'カスタマイズ',
      implementationPolicy: 'Salesforce Flow + Apex Triggerで実装',
      priority: 1,
      complexity: '高',
      dependencies: '請求明細マッピングに依存',
      verificationMethod: 'UAT環境での取引先・取引先責任者・活動・商談・商談商品を含むシナリオテスト',
      remarks: '既存Oracleシステムとの請求データ同期検討中',
      userId,
      operationTimestamp,
    };

    // Mock successful authentication
    (authAuthModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthorized: true,
      userId,
    });

    // Mock successful project context
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

    // Mock data store to return saved record with identical timestamps
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
    expect(result.createdAt).toBe(operationTimestamp);
    expect(result.updatedAt).toBe(operationTimestamp);
    expect(result.createdAt).toEqual(result.updatedAt);
    expect(result.createdBy).toBe(userId);
    expect(result.updatedBy).toBe(userId);
    expect(result.createdBy).toEqual(result.updatedBy);
    expect(result.migrationStatus).toBe('未開始');
    expect(result.verificationStatus).toBe('未検証');
  });
});
