import { updateMappingDetails, MappingDetailRecord } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as authorizationModule from '../../src/logic/authentication-authorization';
import * as validationModule from '../../src/logic/data-validation-rules';

jest.mock('../../src/platform/data-store');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/data-validation-rules');

describe('SCEN-179: updateMappingDetails - Optional fields preservation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should preserve existing record values when optional fields are not specified', async () => {
    const mappingDetailId = 'mapping-detail-uuid-001';
    const projectId = 'project-uuid-001';
    const userId = 'user-uuid-002';
    const operationTimestamp = '2026-01-15T14:30:00Z';

    const existingRecord = {
      機能マッピング詳細ID: 'mapping-detail-uuid-001',
      移行プロジェクトID: 'project-uuid-001',
      既存機能名: '請求書作成',
      既存機能説明: 'Oracle請求書作成モジュール',
      マッピング対象オブジェクトID: 'custom-obj-uuid-001',
      マッピング方式: '標準機能',
      実装方針: 'Salesforce Invoice カスタムオブジェクト利用',
      移行ステータス: '未開始',
      優先度: 3,
      複雑度: '中',
      依存関係: '取引先、取引先責任者に依存',
      検証方法: 'ユニットテスト',
      検証ステータス: '未検証',
      備考: '初版マッピング',
      作成日時: '2026-01-01T10:00:00Z',
      作成者: 'user-uuid-001',
      更新日時: '2026-01-01T10:00:00Z',
      更新者: 'user-uuid-001',
      マッピング対象システムID: 'system-uuid-001',
    };

    const updatedRecord = { ...existingRecord };

    (dataStore.listRecords as jest.Mock).mockResolvedValue([existingRecord]);
    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
    });
    (authorizationModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      userId,
    });
    (validationModule.validateStandardFunctionMappings as jest.Mock).mockResolvedValue({
      validationPassed: true,
    });
    (dataStore.updateRecord as jest.Mock).mockResolvedValue(updatedRecord);

    const result = await updateMappingDetails({
      mappingDetailId,
      projectId,
      existingFunctionName: undefined,
      existingFunctionDescription: undefined,
      mappingMethod: undefined,
      implementationPolicy: undefined,
      priority: undefined,
      complexity: undefined,
      dependencies: undefined,
      verificationMethod: undefined,
      remarks: undefined,
      userId,
      operationTimestamp,
    });

    expect(result).toMatchObject({
      mappingDetailId: 'mapping-detail-uuid-001',
      existingFunctionName: '請求書作成',
      mappingMethod: '標準機能',
      verificationMethod: 'ユニットテスト',
      priority: 3,
      complexity: '中',
      dependencies: '取引先、取引先責任者に依存',
      implementationPolicy: 'Salesforce Invoice カスタムオブジェクト利用',
      remarks: '初版マッピング',
    });
  });
});
