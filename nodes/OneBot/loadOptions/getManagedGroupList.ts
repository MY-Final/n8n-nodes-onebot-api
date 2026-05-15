import { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { apiRequest } from '../GenericFunctions';

interface LoginInfoResponse {
	data?: {
		user_id?: number;
	};
}

interface MemberInfoResponse {
	data?: {
		role?: string;
	};
}

interface GroupRecord {
	group_id?: number | string;
	groupId?: number | string;
	gid?: number | string;
	id?: number | string;
	group_name?: string;
	groupName?: string;
	name?: string;
	role?: string;
	permission?: string;
}

interface GroupListResponse {
	data?: GroupRecord[];
}

function parseGroupList(response: GroupListResponse | GroupRecord[]): GroupRecord[] {
	if (Array.isArray(response)) {
		return response;
	}

	if (Array.isArray(response?.data)) {
		return response.data;
	}

	return [];
}

function normalizeGroup(group: GroupRecord) {
	const id = group.group_id ?? group.groupId ?? group.gid ?? group.id;
	const name = group.group_name ?? group.groupName ?? group.name ?? `群${id}`;
	const role = group.role ?? group.permission ?? undefined;
	return { id, name, role };
}

export async function getManagedGroupList(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	try {
		const loginInfo = (await apiRequest.call(this, 'POST', 'get_login_info')) as LoginInfoResponse;
		if (!loginInfo?.data?.user_id) {
			return [{ name: '获取失败', value: '', description: '无法获取登录信息' }];
		}

		const botId = loginInfo.data.user_id;
		const groupListResponse = (await apiRequest.call(this, 'POST', 'get_group_list')) as
			| GroupListResponse
			| GroupRecord[];

		const groupData = parseGroupList(groupListResponse);
		if (groupData.length === 0) {
			return [{ name: '获取失败', value: '', description: '无法获取群列表' }];
		}

		const managedGroups: INodePropertyOptions[] = [];

		for (const raw of groupData) {
			const group = normalizeGroup(raw);
			if (!group.id) continue;

			if (group.role && (group.role === 'admin' || group.role === 'owner')) {
				managedGroups.push({
					name: `${group.name} (${group.role === 'owner' ? '群主' : '管理员'})`,
					value: group.id,
					description: String(group.id),
				});
				continue;
			}

			try {
				const query = { group_id: group.id, user_id: botId };
				const memberInfo = (await apiRequest.call(
					this,
					'POST',
					'get_group_member_info',
					undefined,
					query,
				)) as MemberInfoResponse;
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
