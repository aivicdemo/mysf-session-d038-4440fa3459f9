import { enforceAccessControlForDataDisplay } from '../../src/logic/access-control-enforcement';
import type { EnforceAccessControlInput, UserAccessContext, OrganizationHierarchy, DataAccessRequestContext } from '../../src/logic/access-control-enforcement';

describe('SCEN-1012: アクセス拒否時にdenialReasonに拒否理由が設定される', () => {
  it('取引実績がない営業担当者が顧客情報へモバイルでアクセス時、アクセス拒否となること', async () => {
    // 前提条件: user
    const user: UserAccessContext = {
      userId: 'user-001',
      role: '営業担当者',
      organizationHierarchy: {
        department: 'dept-001',
        position: '営業担当者',
        supervisorId: null,
        subordinateRepresentativeIds: [],
        hierarchyConfirmedAt: new Date('2026-10-12'),
      } as any,
      transactionHistory: [],
    } as any;

    // 前提条件: requestContext
    const requestContext: DataAccessRequestContext = {
      dataType: 'customer_info',
      operationType: 'view',
      deviceContext: {
        deviceType: 'mobile',
        ipAddress: '192.168.1.2',
      },
    } as any;

    const input: EnforceAccessControlInput = {
      user,
      requestContext,
    } as any;

    // 実行
    const result = await enforceAccessControlForDataDisplay(input);

    // 期待結果: accessGranted が false
    expect(result.accessGranted).toBe(false);

    // 期待結果: denialReason に拒否理由が設定されている
    expect(result.denialReason).toBe('このデータへのアクセス権限がありません。');

    // 期待結果: visibleDataScope は空またはnull
    expect(result.visibleDataScope).toBeDefined();
    if (result.visibleDataScope) {
      expect(result.visibleDataScope.visibleCustomerIds.length).toBe(0);
      expect(result.visibleDataScope.visibleDealIds.length).toBe(0);
      expect(result.visibleDataScope.visibleInvoiceIds.length).toBe(0);
    }

    // 期待結果: operationPermissions は空配列
    expect(result.operationPermissions).toBeDefined();
    expect(result.operationPermissions.length).toBe(0);

    // 期待結果: fieldMaskingRules は空配列
    expect(result.fieldMaskingRules).toBeDefined();
    expect(result.fieldMaskingRules.length).toBe(0);
  });
});
