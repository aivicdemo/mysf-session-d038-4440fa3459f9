import {
  saveMappingValidationResult,
  type SaveMappingValidationResultInput,
  type MappingValidationResultRecord,
} from "../../src/logic/mapping-persistence";
import * as dataStore from "../../src/platform/data-store";

jest.mock("../../src/platform/data-store");

describe("SCEN-161: ギャップスコアが最大値の100である場合、検証結果が正常に保存される", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should save mapping validation result with gap score 100 and return the saved record", async () => {
    // Arrange
    const projectId = "550e8400-e29b-41d4-a716-446655440000";
    const mappingDetailId = "550e8400-e29b-41d4-a716-446655440001";
    const validationStatus = "検証完了";
    const gapClassification = "完全対応";
    const gapScore = 100;
    const detectedIssues = "問題なし";
    const recommendations =
      "このマッピングは完全に対応しており、追加のカスタマイズは不要です。";
    const riskLevel = "低";
    const remediationStatus = "対応完了";
    const remarks =
      "Salesforceの標準請求書・請求明細オブジェクトとの完全対応を確認";
    const validatorId = "550e8400-e29b-41d4-a716-446655440002";
    const validationTimestamp = "2026-10-07T06:31:45.000Z";

    const projectRecord = {
      id: projectId,
      プロジェクトID: projectId,
      プロジェクト名: "Salesforce移行プロジェクト",
      ステータス: "進行中",
      説明: "リプレース対象プロジェクト",
    };

    const mappingDetailRecord = {
      id: mappingDetailId,
      機能マッピング詳細ID: mappingDetailId,
      移行プロジェクトID: projectId,
      既存機能名: "請求書",
      マッピング方式: "カスタムオブジェクト",
    };

    const validationResultId = "550e8400-e29b-41d4-a716-446655440003";
    const createdAt = new Date().toISOString();

    const mockValidationResult: MappingValidationResultRecord = {
      validationResultId,
      projectId,
      mappingDetailId,
      validationStatus,
      gapClassification,
      gapScore,
      detectedIssues,
      recommendations,
      riskLevel,
      remediationStatus,
      remarks,
      validatorId,
      validationTimestamp,
      createdAt,
      createdBy: validatorId,
      updatedAt: createdAt,
      updatedBy: validatorId,
    };

    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === "Salesforce移行プロジェクト") {
        return Promise.resolve([projectRecord]);
      }
      if (tableName === "機能マッピング詳細") {
        return Promise.resolve([mappingDetailRecord]);
      }
      if (tableName === "マッピング検証結果") {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    (dataStore.createRecord as jest.Mock).mockResolvedValue(mockValidationResult);

    const input: SaveMappingValidationResultInput = {
      projectId,
      mappingDetailId,
      validationStatus,
      gapClassification,
      gapScore,
      detectedIssues,
      recommendations,
      riskLevel,
      remediationStatus,
      remarks,
      validatorId,
      validationTimestamp,
    };

    // Act
    const result = await saveMappingValidationResult(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.validationResultId).toBe(validationResultId);
    expect(result.projectId).toBe(projectId);
    expect(result.mappingDetailId).toBe(mappingDetailId);
    expect(result.validationStatus).toBe(validationStatus);
    expect(result.gapClassification).toBe(gapClassification);
    expect(result.gapScore).toBe(100);
    expect(result.detectedIssues).toBe(detectedIssues);
    expect(result.recommendations).toBe(recommendations);
    expect(result.riskLevel).toBe(riskLevel);
    expect(result.remediationStatus).toBe(remediationStatus);
    expect(result.remarks).toBe(remarks);
    expect(result.validatorId).toBe(validatorId);
    expect(result.validationTimestamp).toBe(validationTimestamp);
    expect(result.createdAt).toBe(createdAt);
    expect(result.updatedAt).toBe(createdAt);
    expect(result.createdBy).toBe(validatorId);
    expect(result.updatedBy).toBe(validatorId);

    // Verify that createRecord was called with the correct data for the validation result table
    expect(dataStore.createRecord).toHaveBeenCalledWith(
      "マッピング検証結果",
      expect.objectContaining({
        projectId,
        mappingDetailId,
        validationStatus,
        gapClassification,
        gapScore: 100,
        detectedIssues,
        recommendations,
        riskLevel,
        remediationStatus,
        remarks,
        validatorId,
        validationTimestamp,
      })
    );
  });
});
