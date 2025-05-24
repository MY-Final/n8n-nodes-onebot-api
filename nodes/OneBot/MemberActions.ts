import {
  IExecuteFunctions,
  IDataObject,
  IHttpRequestMethods,
} from 'n8n-workflow';

import { apiRequest } from './GenericFunctions';

/**
 * 执行成员关系相关的操作（退群、删除好友等）
 */
export async function executeMemberOperation(this: IExecuteFunctions, index: number): Promise<IDataObject> {
  // 获取操作类型
  const operation = this.getNodeParameter('operation', index) as string;
  let responseData: IDataObject = {};
  let body: IDataObject = {};
  let method: IHttpRequestMethods = 'POST';
  let endpoint = '';

  // 根据操作类型执行相应的操作
  switch (operation) {
    case 'set_group_leave':
      // 退出群聊
      const groupId = this.getNodeParameter('group_id', index) as string | number;
      const isDismiss = this.getNodeParameter('is_dismiss', index, false) as boolean;

      body = {
        group_id: parseInt(groupId.toString(), 10),
        is_dismiss: isDismiss
      };

      endpoint = 'set_group_leave';
      console.log(`执行退群操作, 群ID: ${groupId}, 是否解散: ${isDismiss}`);
      break;

    case 'delete_friend':
      // 删除好友
      const userId = this.getNodeParameter('user_id', index) as string | number;

      body = {
        user_id: parseInt(userId.toString(), 10)
      };

      endpoint = 'delete_friend';
      console.log(`执行删除好友操作, 好友QQ: ${userId}`);
      break;

    case 'batch_operation':
      // 批量操作（清空好友和退群，支持白名单）
      const mode = this.getNodeParameter('batch_mode', index) as string;
      const useWhitelist = this.getNodeParameter('use_whitelist', index, false) as boolean;

      // 处理群聊
      if (mode === 'groups' || mode === 'both') {
        const groupResponse = await handleGroups.call(this, index, useWhitelist);
        responseData.groupResults = groupResponse;
      }

      // 处理好友
      if (mode === 'friends' || mode === 'both') {
        const friendResponse = await handleFriends.call(this, index, useWhitelist);
        responseData.friendResults = friendResponse;
      }

      return responseData;

    default:
      throw new Error(`未知的成员关系操作: ${operation}`);
  }

  // 执行API请求
  console.log(`执行成员关系操作: ${operation}, 端点: ${endpoint}, 请求体:`, JSON.stringify(body));
  responseData = await apiRequest.call(this, method, endpoint, body);

  return responseData;
}

/**
 * 处理群聊批量操作
 */
async function handleGroups(this: IExecuteFunctions, index: number, useWhitelist: boolean): Promise<IDataObject> {
  // 获取所有群聊
  const groupListResponse = await apiRequest.call(this, 'GET', 'get_group_list') as {
    data?: {
      group_id: number;
      group_name: string;
    }[];
  };

  if (!groupListResponse?.data || !Array.isArray(groupListResponse.data) || groupListResponse.data.length === 0) {
    return { success: false, message: '获取群列表失败或没有加入任何群聊' };
  }

  const allGroups = groupListResponse.data;
  console.log(`获取到 ${allGroups.length} 个群聊`);

  // 处理白名单
  let groupsToProcess = [...allGroups];
  if (useWhitelist) {
    const whitelistGroups = this.getNodeParameter('whitelist_groups', index, []) as string[];
    if (whitelistGroups.length > 0) {
      // 将字符串ID转为数字进行比较
      const whitelistGroupIds = whitelistGroups.map(id => parseInt(id.toString(), 10));
      groupsToProcess = allGroups.filter(group => !whitelistGroupIds.includes(group.group_id));
      console.log(`白名单群聊数: ${whitelistGroups.length}, 需要处理的群聊数: ${groupsToProcess.length}`);
    }
  }

  // 获取是否解散群聊选项
  const isDismiss = this.getNodeParameter('is_dismiss_batch', index, false) as boolean;

  // 批量退群
  const successGroups: number[] = [];
  const failedGroups: {id: number, name: string, error: string}[] = [];

  for (const group of groupsToProcess) {
    try {
      await apiRequest.call(this, 'POST', 'set_group_leave', {
        group_id: group.group_id,
        is_dismiss: isDismiss
      });
      successGroups.push(group.group_id);
    } catch (error) {
      failedGroups.push({
        id: group.group_id,
        name: group.group_name,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    // 添加延时，避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return {
    success: true,
    total: groupsToProcess.length,
    processed: successGroups.length,
    failed: failedGroups.length,
    successGroups,
    failedGroups
  };
}

/**
 * 处理好友批量操作
 */
async function handleFriends(this: IExecuteFunctions, index: number, useWhitelist: boolean): Promise<IDataObject> {
  // 获取所有好友
  const friendListResponse = await apiRequest.call(this, 'GET', 'get_friend_list') as {
    data?: {
      user_id: number;
      nickname: string;
      remark?: string;
    }[];
  };

  if (!friendListResponse?.data || !Array.isArray(friendListResponse.data) || friendListResponse.data.length === 0) {
    return { success: false, message: '获取好友列表失败或没有好友' };
  }

  const allFriends = friendListResponse.data;
  console.log(`获取到 ${allFriends.length} 个好友`);

  // 处理白名单
  let friendsToProcess = [...allFriends];
  if (useWhitelist) {
    const whitelistFriends = this.getNodeParameter('whitelist_friends', index, []) as string[];
    if (whitelistFriends.length > 0) {
      // 将字符串ID转为数字进行比较
      const whitelistFriendIds = whitelistFriends.map(id => parseInt(id.toString(), 10));
      friendsToProcess = allFriends.filter(friend => !whitelistFriendIds.includes(friend.user_id));
      console.log(`白名单好友数: ${whitelistFriends.length}, 需要处理的好友数: ${friendsToProcess.length}`);
    }
  }

  // 批量删除好友
  const successFriends: number[] = [];
  const failedFriends: {id: number, name: string, error: string}[] = [];

  for (const friend of friendsToProcess) {
    try {
      await apiRequest.call(this, 'POST', 'delete_friend', {
        user_id: friend.user_id
      });
      successFriends.push(friend.user_id);
    } catch (error) {
      failedFriends.push({
        id: friend.user_id,
        name: friend.remark || friend.nickname,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    // 添加延时，避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return {
    success: true,
    total: friendsToProcess.length,
    processed: successFriends.length,
    failed: failedFriends.length,
    successFriends,
    failedFriends
  };
}
