import { updateMappingDetails, MappingDetailRecord } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as authorizationModule from '../../src/logic/authentication-authorization';
import * as validationModule from '../../src/logic/data-validation-rules';

jest.mock('../../src/platform/data-store');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/data-validation-rules');

describe('SCEN-180: updateMappingDetails - updatedAt and updatedBy reflection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reflect operationTimestamp in updatedAt and userId in updatedBy', async () => {
    const mappingDetailId = '550e8400-e29b-41d4-a716-446655440001';
    const projectId = '550e8400-e29b-41d4-a716-446655440100';
    const existingFunctionName = '請求書承認フロー';
    const mappingMethod = 'カスタマイズ';
    const userId = '550e8400-e29b-41d4-a716-446655440500';
    const operationTimestamp = '2026-01-20T14:30:45Z';

    const existingRecord = {
      機能マッピング詳細ID: '550e8400-e29b-41d4-a716-446655440001',
      移行プロジェクトID: '550e8400-e29b-41d4-a716-446655440100',
      既存機能名: '請求書承認',
      既存機能説明: '請求書の承認ワークフロー',
      マッピング対象オブジェクトID: '550e8400-e29b-41d4-a716-446655440200',
      マッピング方式: '標準機能',
      実装方針: 'Salesforce承認プロセス',
      移行ステータス: '未開始',
      優先度: 2,
      複雑度: '低',
      依存関係: 'なし',
      検証方法: '手動テスト',
      検証ステータス: '未検証',
      備考: '初期マッピング',
      作成日時: '2026-01-15T10:00:00Z',
      作成者: '550e8400-e29b-41d4-a716-446655440300',
      更新日時: '2026-01-15T10:00:00Z',
      更新者: '550e8400-e29b-41d4-a716-446655440300',
      マッピング対象システムID: '550e8400-e29b-41d4-a716-446655440400',
    };

    const updatedRecord = {
      ...existingRecord,
      既存機能名: '請求書承認フロー',
      マッピング方式: 'カスタマイズ',
      更新日時: '2026-01-20T14:30:45Z',
      更新者: '550e8400-e29b-41d4-a716-446655440500',
    };

    (dataStore.listRecords as jest.Mock).mockResolvedValue([existingRecord]);
    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
    });
    (authorizationModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      userId,
    });
    (validationModule.validateStandardFunctionMappings as jest.Mock).mockResolvedValue({
      validationResult: 'success',
    });
    (dataStore.updateRecord as jest.Mock).mockResolvedValue(updatedRecord);

    const result = await updateMappingDetails({
      mappingDetailId,
      projectId,
      existingFunctionName,
      mappingMethod,
      userId,
      operationTimestamp,
    });

    expect(result).toMatchObject({
      mappingDetailId: '550e8400-e29b-41d4-a716-446655440001',
      projectId: '550e8400-e29b-41d4-a716-446655440100',
      existingFunctionName: '請求書承認フロー',
      mappingMethod: 'カスタマイズ',
      updatedAt: '2026-01-20T14:30:45Z',
      updatedBy: '550e8400-e29b-41d4-a716-446655440500',
      existingFunctionDescription: '請求書の承認ワークフロー',
      mappingTargetObjectId: '550e8400-e29b-41d4-a716-446655440200',
      implementationPolicy: 'Salesforce承認プロセス',
      migrationStatus: '未開始',
      priority: 2,
      complexity: '低',
      dependencies: 'なし',
      verificationMethod: '手動テスト',
      verificationStatus: '未検証',
      remarks: '初期マッピング',
      createdAt: '2026-01-15T10:00:00Z',
      createdBy: '550e8400-e29b-41d4-a716-446655440300',
      targetSystemId: '550e8400-e29b-41d4-a716-446655440400',
    });
  });
});
