import { saveMappingDetails, MappingDetailRecord } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';
import * as authModule from '../../src/logic/authentication-authorization';
import * as projectContextModule from '../../src/logic/project-context-resolver';
import * as validationModule from '../../src/logic/data-validation-rules';

jest.mock('../../src/platform/data-store');
jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/data-validation-rules');

describe('SCEN-151: saveMappingDetails - createdBy/updatedBy と createdAt/updatedAt が同じ値で記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('返却されるレコードの作成者と更新者が同じユーザーID（操作実行ユーザー）として記録される', async () => {
    const userId = '880e8400-e29b-41d4-a716-446655440003';
    const operationTimestamp = '2026-01-15T10:30:45.000Z';
    const projectId = '550e8400-e29b-41d4-a716-446655440000';
    const targetSystemId = '660e8400-e29b-41d4-a716-446655440001';

    // ユーザー認証状態のモック
    jest.spyOn(authModule, 'verifyUserAuthenticationAndAuthorization').mockResolvedValue({
      isAuthenticated: true,
      hasPermission: true,
      userId: userId,
    } as any);

    // プロジェクトコンテキストのモック
    jest.spyOn(projectContextModule, 'resolveProjectContext').mockResolvedValue({
      projectId: projectId,
      targetSystemId: targetSystemId,
      projectStatus: '進行中',
      targetSystemStatus: '有効',
    } as any);

    // 入力データの整合性のモック
    jest.spyOn(validationModule, 'validateStandardFunctionMappings').mockResolvedValue({
      isValid: true,
      validationErrors: [],
    } as any);

    // データベース保存のモック
    const createdRecord: MappingDetailRecord = {
      mappingDetailId: '770e8400-e29b-41d4-a716-446655440002',
      projectId: projectId,
      targetSystemId: targetSystemId,
      existingFunctionName: '請求書作成',
      existingFunctionDescription: 'Oracle ERP上で請求書を作成する機能',
      mappingTargetObjectId: '770e8400-e29b-41d4-a716-446655440002',
      mappingMethod: 'カスタマイズ',
      implementationPolicy: 'カスタムオブジェクト請求書にフロー実装',
      priority: 2,
      complexity: '中',
      dependencies: '取引先、取引先責任者との参照関係あり',
      verificationMethod: 'サンドボックス環境でのユーザー受け入れテスト',
      remarks: '既存請求書フロー完全置き換え対象',
      migrationStatus: '未開始',
      verificationStatus: '未検証',
      createdAt: operationTimestamp,
      createdBy: userId,
      updatedAt: operationTimestamp,
      updatedBy: userId,
    };

    jest.spyOn(dataStore, 'createRecord').mockResolvedValue(createdRecord as any);

    const input = {
      projectId: projectId,
      targetSystemId: targetSystemId,
      existingFunctionName: '請求書作成',
      existingFunctionDescription: 'Oracle ERP上で請求書を作成する機能',
      mappingTargetObjectId: '770e8400-e29b-41d4-a716-446655440002',
      mappingMethod: 'カスタマイズ',
      implementationPolicy: 'カスタムオブジェクト請求書にフロー実装',
      priority: 2,
      complexity: '中',
      dependencies: '取引先、取引先責任者との参照関係あり',
      verificationMethod: 'サンドボックス環境でのユーザー受け入れテスト',
      remarks: '既存請求書フロー完全置き換え対象',
      userId: userId,
      operationTimestamp: operationTimestamp,
    };

    const result = await saveMappingDetails(input);

    // createdBy と updatedBy が同じユーザーID であることを確認
    expect(result.createdBy).toBe(userId);
    expect(result.updatedBy).toBe(userId);

    // createdAt と updatedAt が同じ日時値であることを確認
    expect(result.createdAt).toBe(operationTimestamp);
    expect(result.updatedAt).toBe(operationTimestamp);

    // migrationStatus が「未開始」であることを確認
    expect(result.migrationStatus).toBe('未開始');

    // verificationStatus が「未検証」であることを確認
    expect(result.verificationStatus).toBe('未検証');
  });
});
