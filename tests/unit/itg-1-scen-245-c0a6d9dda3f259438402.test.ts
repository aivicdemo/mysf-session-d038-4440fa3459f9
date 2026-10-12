import { jest } from '@jest/globals';
import { submitIssueReport, InvalidIssueType } from '../../src/logic/issue-reporting-coordination';
import type { SubmitIssueReportInput, IssueReportContent } from '../../src/logic/issue-reporting-coordination';

describe('SCEN-245: 報告種別が unbilled でも delayed でもない値だと InvalidIssueType エラーが発生する', () => {
  it('should throw InvalidIssueType error when issueType is invalid_type', async () => {
    // Arrange
    const dealId = 'DEAL-001';
    const issueType = 'invalid_type' as any;
    const reportContent: IssueReportContent = {
      reason: '請求書が未発行のまま',
      expectedInvoiceDate: new Date('2024-01-15'),
      currentStatus: '未請求',
    };
    const reportedBy = 'SALES-001';
    const currentDateTime = new Date('2024-01-20T10:00:00Z');

    const input: SubmitIssueReportInput = {
      dealId,
      issueType,
      reportContent,
      reportedBy,
      currentDateTime,
    };

    // Act & Assert
    await expect(submitIssueReport(input)).rejects.toThrow(InvalidIssueType);
    await expect(submitIssueReport(input)).rejects.toThrow(
      '報告内容の種別が無効です。請求漏れ（unbilled）または遅延（delayed）を指定してください。'
    );
  });
});
