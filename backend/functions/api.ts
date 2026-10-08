import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  DynamoDBClient,
  BatchWriteItemCommand,
  BatchWriteItemCommandInput,
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  ScanCommand,
  QueryCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { extractAuthContext, requirePermission, Role } from './rbac';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.MAIN_TABLE || 'SalesIntegrationTable';

interface AuditLog {
  pk: string;
  sk: string;
  userId: string;
  operation: string;
  tableName: string;
  recordId?: string;
  timestamp: number;
  details: Record<string, unknown>;
}

interface BulkImportRequest {
  items: Record<string, unknown>[];
}

interface BulkImportResponse {
  imported: number;
  failed: number;
  errors: string[];
}

const TABLE_CONFIGS: Record<string, { pk: string; sk?: string }> = {
  '0': { pk: 'CUSTOMER', sk: 'id' },
  '1': { pk: 'SALESPERSON', sk: 'id' },
  '2': { pk: 'ACTIVITY', sk: 'id' },
  '3': { pk: 'DEAL', sk: 'id' },
  '4': { pk: 'DEALSTAGE', sk: 'id' },
  '5': { pk: 'INVOICE', sk: 'id' },
  '6': { pk: 'INVOICEDETAIL', sk: 'id' },
  '7': { pk: 'SALESGOAL', sk: 'id' },
  '8': { pk: 'USER', sk: 'id' },
  '9': { pk: 'USERPERMISSION', sk: 'id' },
  '10': { pk: 'VALIDATIONRULE', sk: 'id' },
  '11': { pk: 'ANOMALYLOG', sk: 'id' },
  '12': { pk: 'OPERATIONLOG', sk: 'id' },
};

async function writeAuditLog(auditLog: AuditLog): Promise<void> {
  try {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: auditLog,
      })
    );
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}

function createAuditLog(
  userId: string,
  operation: string,
  tableName: string,
  recordId?: string,
  details?: Record<string, unknown>
): AuditLog {
  return {
    pk: 'AUDIT',
    sk: `${Date.now()}#${randomUUID()}`,
    userId,
    operation,
    tableName,
    recordId,
    timestamp: Date.now(),
    details: details || {},
  };
}

function createErrorResponse(statusCode: number, message: string): APIGatewayProxyResult {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: message }),
  };
}

function createSuccessResponse(statusCode: number, data: unknown): APIGatewayProxyResult {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  };
}

async function handleGetResources(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const authContext = extractAuthContext(event);
    requirePermission(authContext.role, 'resource:read');

    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'attribute_exists(id)',
        Limit: 100,
      })
    );

    return createSuccessResponse(200, {
      items: result.Items || [],
      count: result.Count || 0,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return createErrorResponse(403, error.message);
    }
    if (error instanceof Error && error.message.includes('Missing authorization')) {
      return createErrorResponse(401, error.message);
    }
    console.error('Error in handleGetResources:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

async function handleBulkImport(
  event: APIGatewayProxyEvent,
  tableIndex: string
): Promise<APIGatewayProxyResult> {
  try {
    const authContext = extractAuthContext(event);
    requirePermission(authContext.role, 'resource:bulk');

    const config = TABLE_CONFIGS[tableIndex];
    if (!config) {
      return createErrorResponse(400, `Invalid table index: ${tableIndex}`);
    }

    const body = JSON.parse(event.body || '{}') as BulkImportRequest;
    if (!Array.isArray(body.items)) {
      return createErrorResponse(400, 'Invalid request: items must be an array');
    }

    const items = body.items.map((item) => ({
      ...item,
      id: item.id || randomUUID(),
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
      pk: config.pk,
      sk: item.id || randomUUID(),
    }));

    const errors: string[] = [];
    let imported = 0;
    let failed = 0;

    for (let i = 0; i < items.length; i += 25) {
      const batch = items.slice(i, i + 25);
      const writeRequests = batch.map((item) => ({
        PutRequest: {
          Item: item,
        },
      }));

      const params: BatchWriteItemCommandInput = {
        RequestItems: {
          [TABLE_NAME]: writeRequests,
        },
      };

      try {
        await client.send(new BatchWriteItemCommand(params));
        imported += batch.length;
      } catch (batchError) {
        failed += batch.length;
        errors.push(`Batch ${Math.floor(i / 25)}: ${String(batchError)}`);
      }
    }

    await writeAuditLog(
      createAuditLog(
        authContext.userId,
        'BULK_IMPORT',
        config.pk,
        undefined,
        { tableIndex, imported, failed, totalItems: items.length }
      )
    );

    const response: BulkImportResponse = {
      imported,
      failed,
      errors,
    };

    return createSuccessResponse(200, response);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return createErrorResponse(403, error.message);
    }
    if (error instanceof Error && error.message.includes('Missing authorization')) {
      return createErrorResponse(401, error.message);
    }
    console.error('Error in handleBulkImport:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

async function handleGetResourceById(
  event: APIGatewayProxyEvent,
  tableIndex: string
): Promise<APIGatewayProxyResult> {
  try {
    const authContext = extractAuthContext(event);
    requirePermission(authContext.role, 'resource:read');

    const config = TABLE_CONFIGS[tableIndex];
    if (!config) {
      return createErrorResponse(400, `Invalid table index: ${tableIndex}`);
    }

    const id = event.pathParameters?.id;
    if (!id) {
      return createErrorResponse(400, 'Missing id parameter');
    }

    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          pk: config.pk,
          sk: id,
        },
      })
    );

    if (!result.Item) {
      return createErrorResponse(404, `Resource not found: ${id}`);
    }

    return createSuccessResponse(200, result.Item);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return createErrorResponse(403, error.message);
    }
    if (error instanceof Error && error.message.includes('Missing authorization')) {
      return createErrorResponse(401, error.message);
    }
    console.error('Error in handleGetResourceById:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

async function handleCreateResource(
  event: APIGatewayProxyEvent,
  tableIndex: string
): Promise<APIGatewayProxyResult> {
  try {
    const authContext = extractAuthContext(event);
    requirePermission(authContext.role, 'resource:create');

    const config = TABLE_CONFIGS[tableIndex];
    if (!config) {
      return createErrorResponse(400, `Invalid table index: ${tableIndex}`);
    }

    const body = JSON.parse(event.body || '{}') as Record<string, unknown>;
    const id = randomUUID();
    const now = new Date().toISOString();

    const item = {
      ...body,
      id,
      pk: config.pk,
      sk: id,
      createdAt: now,
      updatedAt: now,
      createdBy: authContext.userId,
      updatedBy: authContext.userId,
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      })
    );

    await writeAuditLog(
      createAuditLog(
        authContext.userId,
        'CREATE',
        config.pk,
        id,
        { item }
      )
    );

    return createSuccessResponse(201, item);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return createErrorResponse(403, error.message);
    }
    if (error instanceof Error && error.message.includes('Missing authorization')) {
      return createErrorResponse(401, error.message);
    }
    console.error('Error in handleCreateResource:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

async function handleUpdateResource(
  event: APIGatewayProxyEvent,
  tableIndex: string
): Promise<APIGatewayProxyResult> {
  try {
    const authContext = extractAuthContext(event);
    requirePermission(authContext.role, 'resource:update');

    const config = TABLE_CONFIGS[tableIndex];
    if (!config) {
      return createErrorResponse(400, `Invalid table index: ${tableIndex}`);
    }

    const id = event.pathParameters?.id;
    if (!id) {
      return createErrorResponse(400, 'Missing id parameter');
    }

    const body = JSON.parse(event.body || '{}') as Record<string, unknown>;
    const now = new Date().toISOString();

    const updateExpression = Object.keys(body)
      .map((key, index) => `${key} = :val${index}`)
      .join(', ');
    const expressionAttributeValues: Record<string, unknown> = {};
    Object.entries(body).forEach(([key, value], index) => {
      expressionAttributeValues[`:val${index}`] = value;
    });
    expressionAttributeValues[':updatedAt'] = now;
    expressionAttributeValues[':updatedBy'] = authContext.userId;

    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          pk: config.pk,
          sk: id,
        },
        UpdateExpression: `SET ${updateExpression}, updatedAt = :updatedAt, updatedBy = :updatedBy`,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      })
    );

    await writeAuditLog(
      createAuditLog(
        authContext.userId,
        'UPDATE',
        config.pk,
        id,
        { changes: body }
      )
    );

    return createSuccessResponse(200, result.Attributes);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return createErrorResponse(403, error.message);
    }
    if (error instanceof Error && error.message.includes('Missing authorization')) {
      return createErrorResponse(401, error.message);
    }
    console.error('Error in handleUpdateResource:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

async function handleDeleteResource(
  event: APIGatewayProxyEvent,
  tableIndex: string
): Promise<APIGatewayProxyResult> {
  try {
    const authContext = extractAuthContext(event);
    requirePermission(authContext.role, 'resource:delete');

    const config = TABLE_CONFIGS[tableIndex];
    if (!config) {
      return createErrorResponse(400, `Invalid table index: ${tableIndex}`);
    }

    const id = event.pathParameters?.id;
    if (!id) {
      return createErrorResponse(400, 'Missing id parameter');
    }

    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          pk: config.pk,
          sk: id,
        },
      })
    );

    await writeAuditLog(
      createAuditLog(
        authContext.userId,
        'DELETE',
        config.pk,
        id
      )
    );

    return createSuccessResponse(204, null);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return createErrorResponse(403, error.message);
    }
    if (error instanceof Error && error.message.includes('Missing authorization')) {
      return createErrorResponse(401, error.message);
    }
    console.error('Error in handleDeleteResource:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const path = event.path || '';
  const method = event.httpMethod || 'GET';

  try {
    if (path === '/resources' && method === 'GET') {
      return await handleGetResources(event);
    }

    const bulkMatch = path.match(/^\/api\/(\d+)\/bulk$/);
    if (bulkMatch && method === 'POST') {
      return await handleBulkImport(event, bulkMatch[1]);
    }

    const getByIdMatch = path.match(/^\/api\/(\d+)\/(.*?)$/);
    if (getByIdMatch && method === 'GET') {
      return await handleGetResourceById(
        { ...event, pathParameters: { id: getByIdMatch[2] } },
        getByIdMatch[1]
      );
    }

    const createMatch = path.match(/^\/api\/(\d+)$/);
    if (createMatch && method === 'POST') {
      return await handleCreateResource(event, createMatch[1]);
    }

    const updateMatch = path.match(/^\/api\/(\d+)\/(.*?)$/);
    if (updateMatch && method === 'PUT') {
      return await handleUpdateResource(
        { ...event, pathParameters: { id: updateMatch[2] } },
        updateMatch[1]
      );
    }

    const deleteMatch = path.match(/^\/api\/(\d+)\/(.*?)$/);
    if (deleteMatch && method === 'DELETE') {
      return await handleDeleteResource(
        { ...event, pathParameters: { id: deleteMatch[2] } },
        deleteMatch[1]
      );
    }

    return createErrorResponse(404, 'Not found');
  } catch (error) {
    console.error('Unhandled error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};