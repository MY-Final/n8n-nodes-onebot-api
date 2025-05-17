import {
  IExecuteFunctions,
  IDataObject,
  IHttpRequestMethods,
} from 'n8n-workflow';

import { apiRequest } from './GenericFunctions';

/**
 * 检查机器人在群中的权限
 *
 * @param executeFunctions - 执行函数上下文
 * @param groupId - 群ID
 * @returns 包含权限信息的对象
 */
async function checkBotGroupPermission(
  executeFunctions: IExecuteFunctions,
  groupId: string | number
): Promise<{ isAdmin: boolean; isOwner: boolean; canOperate: boolean }> {
  try {
    // 1. 获取机器人的登录信息
    const loginInfo = await apiRequest.call(executeFunctions, 'GET', 'get_login_info');

    if (!loginInfo?.data?.user_id) {
      console.error('获取登录信息失败，无法检查权限');
      return { isAdmin: false, isOwner: false, canOperate: false };
    }

    const botId = loginInfo.data.user_id;
    console.log(`当前机器人QQ: ${botId}`);

    // 2. 获取机器人在群中的信息
    const query = { group_id: groupId, user_id: botId };
    const memberInfo = await apiRequest.call(executeFunctions, 'GET', 'get_group_member_info', undefined, query);

    if (!memberInfo?.data) {
      console.error('获取群成员信息失败，无法检查权限');
      return { isAdmin: false, isOwner: false, canOperate: false };
    }

    // 3. 检查权限
    const role = memberInfo.data.role || '';
    const isOwner = role === 'owner';
    const isAdmin = role === 'admin' || isOwner;

    console.log(`机器人在群 ${groupId} 中的角色: ${role}, 是管理员: ${isAdmin}, 是群主: ${isOwner}`);

    return {
      isAdmin,
      isOwner,
      canOperate: isAdmin // 只有管理员或群主才能操作
    };
  } catch (error) {
    console.error('检查权限时出错:', error instanceof Error ? error.message : String(error));
    return { isAdmin: false, isOwner: false, canOperate: false };
  }
}

/**
 * 执行群组相关的操作
 */
export async function executeGroupOperation(this: IExecuteFunctions, index: number): Promise<IDataObject> {
  // 获取操作类型
  const operation = this.getNodeParameter('operation', index) as string;
  let responseData: IDataObject = {};
  let body: IDataObject = {};
  let query: IDataObject = {};
  let method: IHttpRequestMethods = 'GET';
  let endpoint = '';

  // 某些操作不需要群组ID，如获取群列表
  if (operation === 'get_group_list') {
    console.log(`执行群组操作: ${operation}`);
    endpoint = 'get_group_list';
    method = 'GET';

    console.log(`执行群组操作: ${operation}, 端点: ${endpoint}`);
    responseData = await apiRequest.call(this, method, endpoint);
    return responseData;
  }

  // 获取群组ID（其他操作都需要）
  const groupId = this.getNodeParameter('group_id', index) as string | number;
  console.log(`执行群组操作 ${operation}, 群ID: ${groupId}`);

  // 根据操作类型执行相应的操作
  switch (operation) {
    case 'get_group_info':
      // 获取群信息
      query.group_id = groupId;
      endpoint = 'get_group_info';
      method = 'GET';
      break;

    case 'get_group_member_info':
      // 获取群成员信息
      const memberInfoUserId = this.getNodeParameter('user_id', index);
      query.group_id = groupId;
      query.user_id = memberInfoUserId;
      endpoint = 'get_group_member_info';
      method = 'GET';
      break;

    case 'get_group_member_list':
      // 获取群成员列表
      query.group_id = groupId;
      endpoint = 'get_group_member_list';
      method = 'GET';
      break;

    case 'set_group_kick':
      // 踢出群成员
      // 检查权限
      const kickPermission = await checkBotGroupPermission(this, groupId);
      if (!kickPermission.isAdmin) {
        throw new Error(`无法执行操作: 踢出群成员需要管理员权限，当前机器人不是群 ${groupId} 的管理员或群主`);
      }

      const kickUserId = this.getNodeParameter('user_ids', index) as string[];
      const rejectAddRequest = this.getNodeParameter('reject_add_request', index) as boolean;

      // 如果有多个成员ID，则创建多个请求
      if (Array.isArray(kickUserId) && kickUserId.length > 0) {
        const kickPromises = kickUserId.map(async (userId) => {
          const kickBody = {
            group_id: groupId,
            user_id: userId,
            reject_add_request: rejectAddRequest
          };
          console.log(`踢出成员 ${userId}, 参数:`, JSON.stringify(kickBody));
          return await apiRequest.call(this, 'POST', 'set_group_kick', kickBody);
        });

        await Promise.all(kickPromises);
        return { success: true, message: `已踢出${kickUserId.length}名成员` };
      } else {
        throw new Error('未选择要踢出的成员');
      }

    case 'set_group_ban':
      // 禁言群成员
      // 检查权限
      const banPermission = await checkBotGroupPermission(this, groupId);
      if (!banPermission.isAdmin) {
        throw new Error(`无法执行操作: 禁言群成员需要管理员权限，当前机器人不是群 ${groupId} 的管理员或群主`);
      }

      const banUserId = this.getNodeParameter('user_ids', index) as string[];
      const duration = this.getNodeParameter('duration', index) as number;

      // 如果有多个成员ID，则创建多个请求
      if (Array.isArray(banUserId) && banUserId.length > 0) {
        const banPromises = banUserId.map(async (userId) => {
          const banBody = {
            group_id: groupId,
            user_id: userId,
            duration: duration
          };
          console.log(`禁言成员 ${userId} ${duration}秒, 参数:`, JSON.stringify(banBody));
          return await apiRequest.call(this, 'POST', 'set_group_ban', banBody);
        });

        await Promise.all(banPromises);
        return { success: true, message: `已禁言${banUserId.length}名成员` };
      } else {
        throw new Error('未选择要禁言的成员');
      }

    case 'set_group_whole_ban':
      // 全员禁言
      // 检查权限
      const wholeBanPermission = await checkBotGroupPermission(this, groupId);
      if (!wholeBanPermission.isAdmin) {
        throw new Error(`无法执行操作: 全员禁言需要管理员权限，当前机器人不是群 ${groupId} 的管理员或群主`);
      }

      body.group_id = groupId;
      body.enable = this.getNodeParameter('enable', index) as boolean;
      endpoint = 'set_group_whole_ban';
      method = 'POST';
      break;

    case 'set_group_name':
      // 设置群名称
      // 检查权限
      const setNamePermission = await checkBotGroupPermission(this, groupId);
      if (!setNamePermission.isAdmin) {
        throw new Error(`无法执行操作: 设置群名称需要管理员权限，当前机器人不是群 ${groupId} 的管理员或群主`);
      }

      body.group_id = groupId;
      body.group_name = this.getNodeParameter('group_name', index) as string;
      endpoint = 'set_group_name';
      method = 'POST';
      break;

    case 'set_group_admin':
      // 设置群管理员
      // 检查权限
      const setAdminPermission = await checkBotGroupPermission(this, groupId);
      if (!setAdminPermission.isOwner) {
        throw new Error(`无法执行操作: 设置管理员需要群主权限，当前机器人不是群 ${groupId} 的群主`);
      }

      const adminUserId = this.getNodeParameter('user_ids', index) as string[];
      const enableAdmin = this.getNodeParameter('enable', index) as boolean;

      // 如果有多个成员ID，则创建多个请求
      if (Array.isArray(adminUserId) && adminUserId.length > 0) {
        const adminPromises = adminUserId.map(async (userId) => {
          const adminBody = {
            group_id: groupId,
            user_id: userId,
            enable: enableAdmin
          };
          console.log(`${enableAdmin ? '设置' : '取消'}成员 ${userId} 的管理员权限, 参数:`, JSON.stringify(adminBody));
          return await apiRequest.call(this, 'POST', 'set_group_admin', adminBody);
        });

        await Promise.all(adminPromises);
        return { success: true, message: `已${enableAdmin ? '设置' : '取消'}${adminUserId.length}名成员的管理员权限` };
      } else {
        throw new Error('未选择要设置管理员权限的成员');
      }

    case 'group_poke':
      // 群戳一戳
      body.group_id = groupId;
      const pokeUserId = this.getNodeParameter('user_id', index);
      body.user_id = pokeUserId;
      endpoint = 'send_poke';
      method = 'POST';
      break;

    case 'set_group_sign':
      // 设置群签到
      body.group_id = groupId;
      endpoint = 'set_group_sign';
      method = 'POST';
      break;

    default:
      throw new Error(`未知的群组操作: ${operation}`);
  }

  // 执行API请求
  if (method === 'GET') {
    console.log(`执行群组操作: ${operation}, 端点: ${endpoint}, 查询参数:`, JSON.stringify(query));
    responseData = await apiRequest.call(this, method, endpoint, undefined, query);
  } else {
    console.log(`执行群组操作: ${operation}, 端点: ${endpoint}, 请求体:`, JSON.stringify(body));
    responseData = await apiRequest.call(this, method, endpoint, body);
  }

  return responseData;
}
