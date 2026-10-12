import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import type { DeleteRecordInput, DeleteRecordOutput } from "../../src/logic/data-persistence";
import { deleteRecord } from "../../src/logic/data-persistence";

jest.mock("../../src/platform/data-store", () => ({
  ...jest.requireActual<typeof import("../../src/platform/data-store")>("../../src/platform/data-store"),
  listRecords: jest.fn(),
  deleteRecord: jest.fn(),
}));

import * as dataStore from "../../src/platform/data-store";

describe("SCEN-970: 存在する活動頻度マスタレコードを指定IDで削除", () => {
  const mockActivityFrequency = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    活動頻度ID: "550e8400-e29b-41d4-a716-446655440000",
    活動頻度名: "日次",
    説明: "毎日の営業活動",
    有効フラグ: true,
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-15T14:30:00.000Z",
    作成者: "admin-user-001",
    更新者: "admin-user-002",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should delete an existing activity frequency master record and return success", async () => {
    (dataStore.listRecords as any).mockResolvedValue([mockActivityFrequency]);
    (dataStore.deleteRecord as any).mockResolvedValue(undefined);

    const input: DeleteRecordInput = {
      targetTableName: "活動頻度マスタ",
      targetRecordId: "550e8400-e29b-41d4-a716-446655440000",
    };

    const result = await deleteRecord(input);

    expect(result.targetTableName).toBe("活動頻度マスタ");
    expect(result.targetRecordId).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(result.success).toBe(true);
    expect(typeof result.deletedAt).toBe("string");
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(result.deletedAt)).toBe(true);

    expect(dataStore.listRecords).toHaveBeenCalledWith("活動頻度マスタ");
    expect(dataStore.deleteRecord).toHaveBeenCalledWith("活動頻度マスタ", "550e8400-e29b-41d4-a716-446655440000");
  });
});
