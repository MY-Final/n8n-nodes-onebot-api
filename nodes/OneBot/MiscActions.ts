import {
  IExecuteFunctions,
  IDataObject,
  IHttpRequestMethods,
} from 'n8n-workflow';

import { apiRequest } from './GenericFunctions';

/**
 * 执行杂项相关的操作
 */
export async function executeMiscOperation(this: IExecuteFunctions, index: number): Promise<IDataObject> {
  // 获取操作类型
  const operation = this.getNodeParameter('operation', index) as string;
  let responseData: IDataObject = {};
  let method: IHttpRequestMethods = 'GET';
  let endpoint = '';

  // 根据操作类型执行相应的操作
  switch (operation) {
    case 'get_status':
      // 获取OneBot状态
      endpoint = 'get_status';
      method = 'GET';
      break;
      
    case 'get_version_info':
      // 获取OneBot版本信息
      endpoint = 'get_version_info';
      method = 'GET';
      break;
    
    default:
      throw new Error(`未知的杂项操作: ${operation}`);
  }

  // 执行API请求
  console.log(`执行杂项操作: ${operation}, 端点: ${endpoint}`);
  responseData = await apiRequest.call(this, method, endpoint);
  
  return responseData;
} 