import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import type { DeleteRecordInput, DeleteRecordOutput } from "../../src/logic/data-persistence";
import { deleteRecord } from "../../src/logic/data-persistence";

jest.mock("../../src/platform/data-store", () => ({
  ...jest.requireActual<typeof import("../../src/platform/data-store")>("../../src/platform/data-store"),
  listRecords: jest.fn(),
  deleteRecord: jest.fn(),
}));

import * as dataStore from "../../src/platform/data-store";

describe("SCEN-966: 存在する操作履歴レコードを指定IDで削除", () => {
  const mockOperationAuditLog = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    ユーザーID: "660e8400-e29b-41d4-a716-446655440001",
    操作種別: "DELETE",
    対象テーブル名: "商談",
    対象レコードID: "770e8400-e29b-41d4-a716-446655440002",
    変更前値: '{"ステージ": "提案"}',
    変更後値: null,
    操作内容詳細: "商談レコード削除",
    IPアドレス: "192.168.1.100",
    セッションID: "sess-abc123def456",
    操作ステータス: "成功",
    エラーメッセージ: null,
    操作実行日時: "2026-01-15T10:30:00Z",
    createdAt: "2026-01-15T10:30:00Z",
    updatedAt: "2026-01-15T10:30:00Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should delete an existing operation audit log record and return success", async () => {
    (dataStore.listRecords as any).mockResolvedValue([mockOperationAuditLog]);
    (dataStore.deleteRecord as any).mockResolvedValue(undefined);

    const input: DeleteRecordInput = {
      targetTableName: "操作履歴",
      targetRecordId: "550e8400-e29b-41d4-a716-446655440000",
    };

    const result = await deleteRecord(input);

    expect(result.targetTableName).toBe("操作履歴");
    expect(result.targetRecordId).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(result.success).toBe(true);
    expect(typeof result.deletedAt).toBe("string");
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(result.deletedAt)).toBe(true);

    expect(dataStore.listRecords).toHaveBeenCalledWith("操作履歴");
    expect(dataStore.deleteRecord).toHaveBeenCalledWith("操作履歴", "550e8400-e29b-41d4-a716-446655440000");
  });
});
