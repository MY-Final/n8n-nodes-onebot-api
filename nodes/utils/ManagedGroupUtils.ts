import { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { apiRequest } from '../OneBot/GenericFunctions';

interface GroupInfo {
	id?: number | string;
	name?: string;
	role?: string;
	group_id?: number | string;
	group_name?: string;
	groupId?: number | string;
	groupName?: string;
	gid?: number | string;
	permission?: string;
}

interface LoginInfoResponse {
	data?: {
		user_id?: number;
	};
}

interface GroupMemberInfoResponse {
	data?: {
		role?: string;
	};
}

/**
 * 将群对象统一为 { id, name, role } 结构，适配不同字段名
 */
function normalizeGroup(
	group: GroupInfo,
): { id: string | number; name: string; role?: string } | null {
	const id = group.group_id ?? group.groupId ?? group.gid ?? group.id;
	if (!id) return null;
	const name = group.group_name ?? group.groupName ?? group.name ?? `群${id}`;
	const role = group.role ?? group.permission ?? undefined;
	return { id, name, role };
}

/**
 * 获取机器人在有管理员或群主权限的群列表
 */
export async function getManagedGroupList(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	try {
		// 获取机器人登录信息
		const loginInfo = (await apiRequest.call(this, 'GET', 'get_login_info')) as LoginInfoResponse;

		if (!loginInfo?.data?.user_id) {
			return [{ name: '获取失败', value: '', description: '无法获取登录信息' }];
		}

		const botId = loginInfo.data.user_id;

		// 获取群列表
		const groupListResponse = (await apiRequest.call(this, 'GET', 'get_group_list')) as
			| {
					data?: GroupInfo[];
			  }
			| GroupInfo[];

		let groupData: GroupInfo[] = [];
		if (Array.isArray(groupListResponse)) {
			groupData = groupListResponse;
		} else if (groupListResponse?.data && Array.isArray(groupListResponse.data)) {
			groupData = groupListResponse.data;
		} else {
			return [{ name: '获取失败', value: '', description: '无法获取群列表' }];
		}

		const managedGroups: INodePropertyOptions[] = [];

		for (const raw of groupData) {
			const group = normalizeGroup(raw);
			if (!group) continue;

			// 如果群列表里已有 role 信息
			if (group.role && (group.role === 'admin' || group.role === 'owner')) {
				managedGroups.push({
					name: `${group.name} (${group.role === 'owner' ? '群主' : '管理员'})`,
					value: group.id,
					description: String(group.id),
				});
				continue;
			}

			// 否则查询机器人在该群的成员信息
			try {
				const query = { group_id: group.id, user_id: botId };
				const memberInfo = (await apiRequest.call(
					this,
					'GET',
					'get_group_member_info',
					undefined,
					query,
				)) as GroupMemberInfoResponse;

				const role = memberInfo?.data?.role;
				if (role === 'admin' || role === 'owner') {
					managedGroups.push({
						name: `${group.name} (${role === 'owner' ? '群主' : '管理员'})`,
						value: group.id,
						description: String(group.id),
					});
				}
			} catch {
				continue;
			}
		}

		if (managedGroups.length === 0) {
			return [
				{ name: '没有管理权限的群聊', value: '', description: '机器人不是任何群的管理员或群主' },
			];
		}

		return managedGroups;
	} catch {
		return [{ name: '获取失败', value: '', description: '获取管理的群聊列表时出错' }];
	}
}

/**
 * 获取机器人作为群主的群列表
 */
export async function getOwnedGroupList(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	try {
		// 获取机器人登录信息
		const loginInfo = (await apiRequest.call(this, 'GET', 'get_login_info')) as LoginInfoResponse;

		if (!loginInfo?.data?.user_id) {
			return [{ name: '获取失败', value: '', description: '无法获取登录信息' }];
		}

		const botId = loginInfo.data.user_id;

		// 获取群列表
		const groupListResponse = (await apiRequest.call(this, 'GET', 'get_group_list')) as
			| {
					data?: GroupInfo[];
			  }
			| GroupInfo[];

		let groupData: GroupInfo[] = [];
		if (Array.isArray(groupListResponse)) {
			groupData = groupListResponse;
		} else if (groupListResponse?.data && Array.isArray(groupListResponse.data)) {
			groupData = groupListResponse.data;
		} else {
			return [{ name: '获取失败', value: '', description: '无法获取群列表' }];
		}

		const ownedGroups: INodePropertyOptions[] = [];

		for (const raw of groupData) {
			const group = normalizeGroup(raw);
			if (!group) continue;

			// 如果已有 role 信息且是群主
			if (group.role === 'owner') {
				ownedGroups.push({
					name: `${group.name} (群主)`,
					value: group.id,
					description: String(group.id),
				});
				continue;
			}

			// 否则查询该群的成员信息
			if (!group.role) {
				try {
					const query = { group_id: group.id, user_id: botId };
					const memberInfo = (await apiRequest.call(
						this,
						'GET',
						'get_group_member_info',
						undefined,
						query,
					)) as GroupMemberInfoResponse;

					if (memberInfo?.data?.role === 'owner') {
						ownedGroups.push({
							name: `${group.name} (群主)`,
							value: group.id,
							description: String(group.id),
						});
					}
				} catch {
					continue;
				}
			}
		}

		if (ownedGroups.length === 0) {
			return [{ name: '没有群主权限的群聊', value: '', description: '机器人不是任何群的群主' }];
		}

		return ownedGroups;
	} catch {
		return [{ name: '获取失败', value: '', description: '获取群主的群聊列表时出错' }];
	}
}
