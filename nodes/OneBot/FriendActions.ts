import {
  IExecuteFunctions,
  IDataObject,
  IHttpRequestMethods,
} from 'n8n-workflow';

import { apiRequest } from './GenericFunctions';

/**
 * 执行好友相关的操作
 */
export async function executeFriendOperation(this: IExecuteFunctions, index: number): Promise<IDataObject> {
  // 获取操作类型
  const operation = this.getNodeParameter('operation', index) as string;
  let responseData: IDataObject = {};
  let body: IDataObject = {};
  let query: IDataObject = {};
  let method: IHttpRequestMethods = 'GET';
  let endpoint = '';

  // 根据操作类型执行相应的操作
  switch (operation) {
    case 'get_friend_list':
      // 获取好友列表
      endpoint = 'get_friend_list';
      method = 'GET';
      // get_friend_list不需要参数
      break;
      
    case 'get_stranger_info':
      // 获取陌生人信息
      const strangerUserId = this.getNodeParameter('user_id', index);
      query.user_id = strangerUserId;
      endpoint = 'get_stranger_info';
      method = 'GET';
      break;
      
    case 'send_like':
      // 发送好友赞
      const likeUserId = this.getNodeParameter('user_id', index);
      body.user_id = likeUserId;
      body.times = this.getNodeParameter('times', index) as number;
      endpoint = 'send_like';
      method = 'POST';
      break;
      
    case 'send_friend_poke':
      // 私聊戳一戳
      const friendPokeUserId = this.getNodeParameter('user_id', index);
      body.user_id = friendPokeUserId;
      endpoint = 'send_poke';
      method = 'POST';
      break;
    
    default:
      throw new Error(`未知的好友操作: ${operation}`);
  }

  // 执行API请求
  if (method === 'GET') {
    console.log(`执行好友操作: ${operation}, 端点: ${endpoint}, 查询参数:`, JSON.stringify(query));
    responseData = await apiRequest.call(this, method, endpoint, undefined, query);
  } else {
    console.log(`执行好友操作: ${operation}, 端点: ${endpoint}, 请求体:`, JSON.stringify(body));
    responseData = await apiRequest.call(this, method, endpoint, body);
  }
  
  return responseData;
} 