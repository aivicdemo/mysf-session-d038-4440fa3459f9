import { updateMappingDetails } from '../../src/logic/mapping-persistence';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as authenticationAuthorization from '../../src/logic/authentication-authorization';
import * as dataValidationRules from '../../src/logic/data-validation-rules';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/data-validation-rules');
jest.mock('../../src/platform/data-store');

describe('SCEN-173: updateMappingDetails - 正常系', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('マッピング詳細レコードが更新され、更新後のレコードが返される', async () => {
    const mappingDetailId = '550e8400-e29b-41d4-a716-446655440001';
    const projectId = '660e8400-e29b-41d4-a716-446655440002';
    const targetSystemId = '990e8400-e29b-41d4-a716-446655440005';
    const mappingTargetObjectId = '770e8400-e29b-41d4-a716-446655440003';
    const userId = 'aaa0e8400-e29b-41d4-a716-446655440099';
    const operationTimestamp = '2025-01-15T14:30:00Z';

    // Mock resolveProjectContext
    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
    });

    // Mock verifyUserAuthenticationAndAuthorization
    (authenticationAuthorization.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthorized: true,
    });

    // Mock validateStandardFunctionMappings
    (dataValidationRules.validateStandardFunctionMappings as jest.Mock).mockResolvedValue({
      isValid: true,
    });

    // Mock data store - updateRecord should return the updated record
    (dataStore.updateRecord as jest.Mock).mockResolvedValue({
      mappingDetailId,
      projectId,
      targetSystemId,
      existingFunctionName: '請求書承認フロー（改善版）',
      existingFunctionDescription: '複数段階の承認プロセスに対応した改善版',
      mappingTargetObjectId,
      mappingMethod: '標準機能',
      implementationPolicy: 'Salesforceの承認プロセスと関連リストを組み合わせて実装',
      migrationStatus: '未開始',
      priority: 1,
      complexity: '高',
      dependencies: '請求書オブジェクト、請求明細オブジェクトに依存',
      verificationMethod: '統合テスト環境でのシナリオテスト',
      verificationStatus: '未検証',
      remarks: '承認者の権限設定に注意が必要',
      createdAt: '2025-01-01T10:00:00Z',
      createdBy: '880e8400-e29b-41d4-a716-446655440004',
      updatedAt: operationTimestamp,
      updatedBy: userId,
    });

    const result = await updateMappingDetails({
      mappingDetailId,
      projectId,
      existingFunctionName: '請求書承認フロー（改善版）',
      existingFunctionDescription: '複数段階の承認プロセスに対応した改善版',
      mappingMethod: '標準機能',
      implementationPolicy: 'Salesforceの承認プロセスと関連リストを組み合わせて実装',
      priority: 1,
      complexity: '高',
      dependencies: '請求書オブジェクト、請求明細オブジェクトに依存',
      verificationMethod: '統合テスト環境でのシナリオテスト',
      remarks: '承認者の権限設定に注意が必要',
      userId,
      operationTimestamp,
    });

    expect(result.mappingDetailId).toBe(mappingDetailId);
    expect(result.projectId).toBe(projectId);
    expect(result.targetSystemId).toBe(targetSystemId);
    expect(result.existingFunctionName).toBe('請求書承認フロー（改善版）');
    expect(result.existingFunctionDescription).toBe('複数段階の承認プロセスに対応した改善版');
    expect(result.mappingTargetObjectId).toBe(mappingTargetObjectId);
    expect(result.mappingMethod).toBe('標準機能');
    expect(result.implementationPolicy).toBe('Salesforceの承認プロセスと関連リストを組み合わせて実装');
    expect(result.migrationStatus).toBe('未開始');
    expect(result.priority).toBe(1);
    expect(result.complexity).toBe('高');
    expect(result.dependencies).toBe('請求書オブジェクト、請求明細オブジェクトに依存');
    expect(result.verificationMethod).toBe('統合テスト環境でのシナリオテスト');
    expect(result.verificationStatus).toBe('未検証');
    expect(result.remarks).toBe('承認者の権限設定に注意が必要');
    expect(result.createdAt).toBe('2025-01-01T10:00:00Z');
    expect(result.createdBy).toBe('880e8400-e29b-41d4-a716-446655440004');
    expect(result.updatedAt).toBe(operationTimestamp);
    expect(result.updatedBy).toBe(userId);
    expect(dataStore.updateRecord).toHaveBeenCalled();
  });
});
