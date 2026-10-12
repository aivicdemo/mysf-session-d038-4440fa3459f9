import { fetchAllUsers } from "../../src/logic/data-persistence";
import * as dataStore from "../../src/platform/data-store";

jest.mock("../../src/platform/data-store");

describe("SCEN-874: ユーザーテーブルにレコードが存在する場合、全ユーザーレコード一覧を取得して返す", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("ユーザーテーブルの全レコードを取得して返す", async () => {
    const mockUsers = [
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        userId: "550e8400-e29b-41d4-a716-446655440001",
        loginId: "user001",
        userName: "田中太郎",
        emailAddress: "tanaka@example.com",
        role: "admin",
        salesRepresentativeId: "550e8400-e29b-41d4-a716-446655440101",
        validFlag: true,
        lastLoginDateTime: "2026-10-07T10:30:00Z",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-10-07T10:30:00Z",
        createdBy: "550e8400-e29b-41d4-a716-446655440000",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440002",
        userId: "550e8400-e29b-41d4-a716-446655440002",
        loginId: "user002",
        userName: "鈴木花子",
        emailAddress: "suzuki@example.com",
        role: "user",
        salesRepresentativeId: "550e8400-e29b-41d4-a716-446655440102",
        validFlag: true,
        lastLoginDateTime: "2026-10-06T15:45:00Z",
        createdAt: "2026-02-15T08:00:00Z",
        updatedAt: "2026-10-06T15:45:00Z",
        createdBy: "550e8400-e29b-41d4-a716-446655440000",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440003",
        userId: "550e8400-e29b-41d4-a716-446655440003",
        loginId: "user003",
        userName: "佐藤次郎",
        emailAddress: "sato@example.com",
        role: "viewer",
        salesRepresentativeId: null,
        validFlag: false,
        lastLoginDateTime: "2026-09-01T12:00:00Z",
        createdAt: "2026-03-20T09:15:00Z",
        updatedAt: "2026-10-01T14:30:00Z",
        createdBy: "550e8400-e29b-41d4-a716-446655440000",
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockUsers);

    const result = await fetchAllUsers({});

    // 3件のユーザーレコードが返される
    expect(result.users).toHaveLength(3);

    // 各ユーザーレコードが正しい属性を保持している
    expect(result.users[0].userId).toBe("550e8400-e29b-41d4-a716-446655440001");
    expect(result.users[0].loginId).toBe("user001");
    expect(result.users[0].userName).toBe("田中太郎");
    expect(result.users[0].emailAddress).toBe("tanaka@example.com");
    expect(result.users[0].role).toBe("admin");
    expect(result.users[0].salesRepresentativeId).toBe(
      "550e8400-e29b-41d4-a716-446655440101"
    );
    expect(result.users[0].validFlag).toBe(true);
    expect(result.users[0].lastLoginDateTime).toBe("2026-10-07T10:30:00Z");
    expect(result.users[0].createdAt).toBe("2026-01-01T00:00:00Z");
    expect(result.users[0].updatedAt).toBe("2026-10-07T10:30:00Z");
    expect(result.users[0].createdBy).toBe("550e8400-e29b-41d4-a716-446655440000");

    expect(result.users[1].userId).toBe("550e8400-e29b-41d4-a716-446655440002");
    expect(result.users[1].loginId).toBe("user002");
    expect(result.users[1].userName).toBe("鈴木花子");

    expect(result.users[2].userId).toBe("550e8400-e29b-41d4-a716-446655440003");
    expect(result.users[2].loginId).toBe("user003");
    expect(result.users[2].userName).toBe("佐藤次郎");
    expect(result.users[2].salesRepresentativeId).toBe(null);
    expect(result.users[2].validFlag).toBe(false);

    // totalCountは3
    expect(result.totalCount).toBe(3);

    // fetchedAtはISO 8601形式の日時文字列
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
