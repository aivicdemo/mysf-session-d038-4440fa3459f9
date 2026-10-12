import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import type { DeleteRecordInput, DeleteRecordOutput } from "../../src/logic/data-persistence";
import { deleteRecord } from "../../src/logic/data-persistence";

jest.mock("../../src/platform/data-store", () => ({
  ...jest.requireActual<typeof import("../../src/platform/data-store")>("../../src/platform/data-store"),
  listRecords: jest.fn(),
  deleteRecord: jest.fn(),
}));

import * as dataStore from "../../src/platform/data-store";

describe("SCEN-965: 存在する異常検知ログレコードを指定IDで削除", () => {
  const mockAnomalyLog = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    異常検知ログID: "550e8400-e29b-41d4-a716-446655440000",
    検知日時: "2026-10-07T10:30:00Z",
    異常タイプ: "金額ズレ",
    重要度: "高",
    対象テーブル: "請求書",
    対象レコードID: "660e8400-e29b-41d4-a716-446655440001",
    検証ルールID: "770e8400-e29b-41d4-a716-446655440002",
    異常内容: "請求金額が期待値と異なります",
    期待値: "100000",
    実際値: "95000",
    ステータス: "未対応",
    対応者ID: null,
    対応日時: null,
    対応コメント: null,
    createdAt: "2026-10-07T10:30:00Z",
    createdById: "880e8400-e29b-41d4-a716-446655440003",
    updatedAt: "2026-10-07T10:30:00Z",
    updatedById: "880e8400-e29b-41d4-a716-446655440003",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should delete an existing anomaly detection log record and return success", async () => {
    (dataStore.listRecords as any).mockResolvedValue([mockAnomalyLog]);
    (dataStore.deleteRecord as any).mockResolvedValue(undefined);

    const input: DeleteRecordInput = {
      targetTableName: "異常検知ログ",
      targetRecordId: "550e8400-e29b-41d4-a716-446655440000",
    };

    const result = await deleteRecord(input);

    expect(result.targetTableName).toBe("異常検知ログ");
    expect(result.targetRecordId).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(result.success).toBe(true);
    expect(typeof result.deletedAt).toBe("string");
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(result.deletedAt)).toBe(true);

    expect(dataStore.listRecords).toHaveBeenCalledWith("異常検知ログ");
    expect(dataStore.deleteRecord).toHaveBeenCalledWith("異常検知ログ", "550e8400-e29b-41d4-a716-446655440000");
  });
});
