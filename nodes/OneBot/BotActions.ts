import {
  IExecuteFunctions,
  IDataObject,
  IHttpRequestMethods,
} from 'n8n-workflow';

import { apiRequest } from './GenericFunctions';

/**
 * 执行机器人相关的操作
 */
export async function executeBotOperation(this: IExecuteFunctions, index: number): Promise<IDataObject> {
  // 获取操作类型
  const operation = this.getNodeParameter('operation', index) as string;
  let responseData: IDataObject = {};
  let body: IDataObject = {};
  let query: IDataObject = {};
  let method: IHttpRequestMethods = 'GET';
  let endpoint = '';

  // 根据操作类型执行相应的操作
  switch (operation) {
    case 'get_login_info':
      // 获取登录信息
      endpoint = 'get_login_info';
      method = 'GET';
      // get_login_info不需要参数
      break;
    
    default:
      throw new Error(`未知的机器人操作: ${operation}`);
  }

  // 执行API请求
  if (method === 'GET') {
    console.log(`执行机器人操作: ${operation}, 端点: ${endpoint}, 查询参数:`, JSON.stringify(query));
    responseData = await apiRequest.call(this, method, endpoint, undefined, query);
  } else {
    console.log(`执行机器人操作: ${operation}, 端点: ${endpoint}, 请求体:`, JSON.stringify(body));
    responseData = await apiRequest.call(this, method, endpoint, body);
  }
  
  return responseData;
} 