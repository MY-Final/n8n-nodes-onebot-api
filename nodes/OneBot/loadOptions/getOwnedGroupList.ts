import { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { apiRequest } from '../GenericFunctions';

function normalizeGroup(group: any) {
	const id = group.group_id ?? group.groupId ?? group.gid ?? group.id;
	const name = group.group_name ?? group.groupName ?? group.name ?? `群${id}`;
	const role = group.role ?? group.permission ?? undefined;
	return { id, name, role };
}

export async function getOwnedGroupList(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	try {
		const loginInfo = (await apiRequest.call(this, 'GET', 'get_login_info')) as { data?: { user_id?: number } };
		if (!loginInfo?.data?.user_id) {
			return [{ name: '获取失败', value: '', description: '无法获取登录信息' }];
		}

		const botId = loginInfo.data.user_id;
		const groupListResponse = (await apiRequest.call(this, 'GET', 'get_group_list')) as { data?: any[] } | any[];

		let groupData: any[] = [];
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
			if (!group.id) continue;

			if (group.role === 'owner') {
				ownedGroups.push({
					name: `${group.name} (群主)`,
					value: group.id,
					description: String(group.id),
				});
				continue;
			}

			if (!group.role) {
				try {
					const query = { group_id: group.id, user_id: botId };
					const memberInfo = (await apiRequest.call(this, 'GET', 'get_group_member_info', undefined, query)) as { data?: { role?: string } };
					if (memberInfo?.data?.role === 'owner') {
						ownedGroups.push({
							name: `${group.name} (群主)`,
							value: group.id,
							description: String(group.id),
						});
					}
				} catch (error) {
					continue;
				}
			}
		}

		if (ownedGroups.length === 0) {
			return [{ name: '没有群主权限的群聊', value: '', description: '机器人不是任何群的群主' }];
		}

		return ownedGroups;
	} catch (error) {
		return [{ name: '获取失败', value: '', description: '获取群主的群聊列表时出错' }];
	}
}