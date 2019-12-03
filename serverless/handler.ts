import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB } from "aws-sdk";
import 'source-map-support/register';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { WasmTestResult, WasmTestRequest } from '../shared/shared';
import uuidV4 from 'uuid/v4';

const dynamoDb = new DynamoDB.DocumentClient();

const headers = {
  'Access-Control-Allow-Origin': '*', // Required for CORS support to work
};

export const putTestData: APIGatewayProxyHandler = (event, _context, callback) => {
  if (!event || !event.body || typeof event.body !== "string") {
    return callback(null, {
      headers,
      statusCode: 400,
      body: "Request is missing body"
    });
  }
  let data: WasmTestRequest;
  try {
    data = JSON.parse(event.body) as WasmTestRequest;
  } catch (err) {
    console.error(err);
    return callback(null, {
      headers,
      statusCode: 400,
      body: "JSON body could not be parsed correctly",
    });
  }

  if (!data.mcpResults || !data.wasmResults || !data.mcpResults.length || !data.wasmResults.length) {
    return callback(null, {
      headers,
      statusCode: 400,
      body: "Request body was missing some required data.",
    });
  }

  const item: WasmTestResult = {
    id: uuidV4(),
    userAgent: event.headers['User-Agent'],
    ...data
  };

  const putItem: DocumentClient.PutItemInput = {
    TableName: process.env.LAB_WASM_TABLE,
    Item: item,
  };

  dynamoDb.put(putItem, (err, _data) => {
    if (err) {
      console.error(err);
      return callback(null, {
        headers,
        statusCode: 500,
        body: err.message,
      });
    }

    return callback(null, {
      headers,
      statusCode: 200,
      body: null,
    });
  });
}
