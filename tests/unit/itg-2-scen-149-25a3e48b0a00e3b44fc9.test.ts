import { saveMappingDetails } from '../../src/logic/mapping-persistence';
import * as authAuthModule from '../../src/logic/authentication-authorization';
import * as projectContextModule from '../../src/logic/project-context-resolver';
import * as validationModule from '../../src/logic/data-validation-rules';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/data-validation-rules');
jest.mock('../../src/platform/data-store');

describe('SCEN-149: saveMappingDetails - 任意フィールド省略時に初期値が設定される', () => {
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

  it('should set initial status values when optional fields are omitted', async () => {
    const projectId = '550e8400-e29b-41d4-a716-446655440000';
    const targetSystemId = '660e8400-e29b-41d4-a716-446655440001';
    const userId = '880e8400-e29b-41d4-a716-446655440003';
    const operationTimestamp = '2026-10-07T12:00:00Z';
    const mappingDetailId = '990e8400-e29b-41d4-a716-446655440004';

    const input = {
      projectId,
      targetSystemId,
      existingFunctionName: '請求書作成',
      mappingTargetObjectId: '770e8400-e29b-41d4-a716-446655440002',
      mappingMethod: '標準機能利用',
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

    // Mock data store to return saved record with initial values
    mockDataStore.createRecord.mockResolvedValue({
      mappingDetailId,
      projectId,
      targetSystemId,
      existingFunctionName: input.existingFunctionName,
      mappingTargetObjectId: input.mappingTargetObjectId,
      mappingMethod: input.mappingMethod,
      migrationStatus: '未開始',
      verificationStatus: '未検証',
      createdAt: operationTimestamp,
      createdBy: userId,
      updatedAt: operationTimestamp,
      updatedBy: userId,
    });

    const result = await saveMappingDetails(input);

    expect(result).toBeDefined();
    expect(result.migrationStatus).toBe('未開始');
    expect(result.verificationStatus).toBe('未検証');
    expect(result.existingFunctionDescription).toBeUndefined();
    expect(result.implementationPolicy).toBeUndefined();
    expect(result.priority).toBeUndefined();
    expect(result.complexity).toBeUndefined();
    expect(result.dependencies).toBeUndefined();
    expect(result.verificationMethod).toBeUndefined();
    expect(result.remarks).toBeUndefined();
  });
});
