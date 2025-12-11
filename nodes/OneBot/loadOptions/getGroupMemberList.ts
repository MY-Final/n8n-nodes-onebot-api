import { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { apiRequest } from '../GenericFunctions';
import {
	getCurrentInput,
	isValidNumber,
	hasSearchInput,
	cleanSearchValues,
	handleEmptyData,
	handleError,
	processSearchAndFilter,
	SearchableOption,
} from '../../utils/SearchUtils';
import { API_PATHS } from '../constants/apiPaths';

export async function getGroupMemberList(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	try {
		let group_id;
		try {
			group_id = this.getNodeParameter('group_id');
		} catch (error) {
			try {
				group_id = this.getNodeParameter('managed_group_id');
			} catch (error) {
				group_id = null;
			}
		}

		if (group_id === undefined || group_id === null || group_id === '') {
			return [{ name: '请先选择群组', value: '', description: '需要先选择一个群组' }];
		}

		const currentInput = getCurrentInput(this, 'user_id', '');
		const isValidQQNumber = isValidNumber(currentInput);
		const hasSearch = hasSearchInput(currentInput);

		const query = { group_id };
		const response = await apiRequest.call(this, 'POST', API_PATHS.getGroupMemberList, undefined, query);
		let memberData = [];

		if (response && typeof response === 'object') {
			if (Array.isArray(response)) {
				memberData = response;
			} else if (response.data && Array.isArray(response.data)) {
				memberData = response.data;
			} else {
				const possibleDataFields = ['result', 'members', 'list', 'member_list'];
				for (const field of possibleDataFields) {
					if (response[field] && Array.isArray(response[field])) {
						memberData = response[field];
						break;
					}
				}
			}
		}

		if (!memberData || memberData.length === 0) {
			return handleEmptyData(isValidQQNumber, currentInput, '未找到群成员', 'qq');
		}

		const validMembers = memberData.filter((info: any) => {
			const userId = info.user_id || info.userId || info.uin || info.id;
			return !!userId && userId !== '' && userId !== 0;
		});

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

		const memberOptions: SearchableOption[] = validMembers
			.map((info: any) => {
				const userId = info.user_id || info.userId || info.uin || info.id || '';
				if (!userId) return null;

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

				return {
					name: `${displayName}${role !== 'member' ? ` (${roleLabel})` : ''} (QQ: ${userId})`,
					value: userId,
					description: `QQ: ${userId}`,
					searchValues: {
						displayName: displayName.toLowerCase(),
						userId: userId.toString().toLowerCase(),
					},
				};
			})
			.filter((item: SearchableOption | null): item is SearchableOption => item !== null);

		const processedOptions = processSearchAndFilter(
			memberOptions,
			currentInput,
			isValidQQNumber,
			hasSearch,
			['displayName', 'userId'],
			'qq',
		);

		const finalOptions = cleanSearchValues(processedOptions);
		return finalOptions;
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