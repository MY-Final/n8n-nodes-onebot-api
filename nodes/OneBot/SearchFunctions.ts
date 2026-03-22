import { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { apiRequest } from './GenericFunctions';
import {
	getCurrentInput,
	isValidNumber,
	hasSearchInput,
	cleanSearchValues,
	handleEmptyData,
	handleError,
	processSearchAndFilter,
	SearchableOption,
} from '../utils/SearchUtils';
import { API_PATHS } from './constants/apiPaths';

interface FriendInfo {
	user_id: number | string;
	nickname?: string;
	remark?: string;
}

interface GroupInfo {
	group_id: number | string;
	group_name?: string;
}

interface GroupMemberInfo {
	user_id?: number | string;
	userId?: number | string;
	uin?: number | string;
	id?: number | string;
	card?: string;
	nickname?: string;
	name?: string;
	role?: string;
	permission?: string;
}

type ObjectLike = Record<string, unknown>;

function getDataArray<T>(response: unknown): T[] {
	if (Array.isArray(response)) {
		return response as T[];
	}

	if (response && typeof response === 'object') {
		const maybeData = (response as ObjectLike).data;
		if (Array.isArray(maybeData)) {
			return maybeData as T[];
		}
	}

	return [];
}

function getArrayFromFields<T>(response: unknown, fields: string[]): T[] {
	if (!response || typeof response !== 'object') {
		return [];
	}

	const objectResponse = response as ObjectLike;
	for (const field of fields) {
		const value = objectResponse[field];
		if (Array.isArray(value)) {
			return value as T[];
		}
	}

	return [];
}

function getMemberUserId(member: GroupMemberInfo): number | string | null {
	const candidate = member.user_id ?? member.userId ?? member.uin ?? member.id;
	if (candidate === undefined || candidate === null || candidate === '' || candidate === 0) {
		return null;
	}
	return candidate;
}

/**
 * 获取好友列表
 * 用于填充好友选择下拉框的选项
 *
 * @param this - 加载选项函数上下文
 * @returns 好友列表选项
 * @author laxtiz
 * @author final
 */
export async function getFriendList(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	try {
		const currentInput = getCurrentInput(this, 'user_id', '');
		const isValidQQNumber = isValidNumber(currentInput);
		const hasSearch = hasSearchInput(currentInput);

		const response = await apiRequest.call(this, 'POST', API_PATHS.getFriendList);
		const friendData = getDataArray<FriendInfo>(response);

		if (!friendData || friendData.length === 0) {
			return handleEmptyData(isValidQQNumber, currentInput, '未找到好友', 'qq');
		}

		const friendOptions: SearchableOption[] = friendData.map((info) => {
			const userId = info.user_id;
			const nickname = info.nickname || '未知昵称';
			const remark = info.remark || '';
			const displayName = remark || nickname;

			return {
				name: `${displayName} (QQ: ${userId})`,
				value: userId,
				description: `QQ: ${userId}`,
				searchValues: {
					displayName: displayName.toLowerCase(),
					userId: userId.toString().toLowerCase(),
				},
			};
		});

		const processedOptions = processSearchAndFilter(
			friendOptions,
			currentInput,
			isValidQQNumber,
			hasSearch,
			['displayName', 'userId'],
			'qq',
		);

		return cleanSearchValues(processedOptions);
	} catch (error) {
		const currentInput = getCurrentInput(this, 'user_id', '');
		return handleError(error, currentInput, '获取好友列表时出错', 'qq');
	}
}

/**
 * 获取群列表
 * 用于填充群选择下拉框的选项
 *
 * @param this - 加载选项函数上下文
 * @returns 群列表选项
 * @author laxtiz
 * @author final
 */
export async function getGroupList(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	try {
		const currentInput = getCurrentInput(this, 'group_id', '');
		const isValidGroupNumber = isValidNumber(currentInput);
		const hasSearch = hasSearchInput(currentInput);

		const response = await apiRequest.call(this, 'POST', API_PATHS.getGroupList);
		const groupData = getDataArray<GroupInfo>(response);

		if (!groupData || groupData.length === 0) {
			return handleEmptyData(isValidGroupNumber, currentInput, '未找到群', 'group');
		}

		const groupOptions: SearchableOption[] = groupData.map((info) => {
			const groupId = info.group_id;
			const groupName = info.group_name || '未知群名称';

			return {
				name: `${groupName} (群号: ${groupId})`,
				value: groupId,
				description: `群号: ${groupId}`,
				searchValues: {
					groupName: groupName.toLowerCase(),
					groupId: groupId.toString().toLowerCase(),
				},
			};
		});

		const processedOptions = processSearchAndFilter(
			groupOptions,
			currentInput,
			isValidGroupNumber,
			hasSearch,
			['groupName', 'groupId'],
			'group',
		);

		return cleanSearchValues(processedOptions);
	} catch (error) {
		const currentInput = getCurrentInput(this, 'group_id', '');
		return handleError(error, currentInput, '获取群列表时出错', 'group');
	}
}

/**
 * 获取群成员列表
 * 用于填充群成员选择下拉框的选项
 *
 * @param this - 加载选项函数上下文
 * @returns 群成员列表选项
 * @author laxtiz
 * @author final
 */
export async function getGroupMemberList(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	try {
		let group_id: string | number | undefined;
		try {
			group_id = this.getNodeParameter('group_id') as string | number;
		} catch {
			group_id = undefined;
		}

		if (group_id === undefined || group_id === null || group_id === '') {
			try {
				group_id = this.getNodeParameter('managed_group_id') as string | number;
			} catch {
				group_id = undefined;
			}
		}

		if (group_id === undefined || group_id === null || group_id === '') {
			return [
				{
					name: '请先选择群组',
					value: '',
					description: '需要先选择一个群组',
				},
			];
		}

		const currentInput = getCurrentInput(this, 'user_id', '');
		const isValidQQNumber = isValidNumber(currentInput);
		const hasSearch = hasSearchInput(currentInput);

		const query = { group_id };
		const response = await apiRequest.call(
			this,
			'POST',
			API_PATHS.getGroupMemberList,
			undefined,
			query,
		);

		let memberData = getDataArray<GroupMemberInfo>(response);
		if (memberData.length === 0) {
			memberData = getArrayFromFields<GroupMemberInfo>(response, [
				'result',
				'members',
				'list',
				'member_list',
			]);
		}

		if (!memberData || memberData.length === 0) {
			return handleEmptyData(isValidQQNumber, currentInput, '未找到群成员', 'qq');
		}

		const validMembers = memberData.filter((info) => getMemberUserId(info) !== null);

		const getRoleLabel = (role: string): string => {
			switch (role) {
				case 'owner':
					return '群主';
				case 'admin':
					return '管理员';
				default:
					return '成员';
			}
		};

		const memberOptions: SearchableOption[] = validMembers.reduce<SearchableOption[]>(
			(acc, info) => {
				const userId = getMemberUserId(info);
				if (!userId) {
					return acc;
				}

				let displayName = '';
				if (info.card && info.card.trim() !== '') {
					displayName = info.card;
				} else if (info.nickname && info.nickname.trim() !== '') {
					displayName = info.nickname;
				} else if (info.name && info.name.trim() !== '') {
					displayName = info.name;
				} else {
					displayName = `成员${userId}`;
				}

				const role = info.role || info.permission || 'member';
				const roleLabel = getRoleLabel(role);

				acc.push({
					name: `${displayName}${role !== 'member' ? ` (${roleLabel})` : ''} (QQ: ${userId})`,
					value: userId,
					description: `QQ: ${userId}`,
					searchValues: {
						displayName: displayName.toLowerCase(),
						userId: userId.toString().toLowerCase(),
					},
				});

				return acc;
			},
			[],
		);

		const processedOptions = processSearchAndFilter(
			memberOptions,
			currentInput,
			isValidQQNumber,
			hasSearch,
			['displayName', 'userId'],
			'qq',
		);

		return cleanSearchValues(processedOptions);
	} catch (error) {
		const currentInput = getCurrentInput(this, 'user_id', '');
		return handleError(
			error,
			currentInput,
			'获取群成员列表时出错，请确保选择了有效的群组且机器人有权限访问',
			'qq',
		);
	}
}
