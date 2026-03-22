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

interface FriendInfo {
	user_id: number | string;
	nickname?: string;
	remark?: string;
}

interface FriendListResponse {
	data?: FriendInfo[];
}

function parseFriendList(response: unknown): FriendInfo[] {
	if (!response || typeof response !== 'object') {
		return [];
	}

	const data = (response as FriendListResponse).data;
	return Array.isArray(data) ? data : [];
}

export async function getFriendList(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	try {
		const currentInput = getCurrentInput(this, 'user_id', '');
		const isValidQQNumber = isValidNumber(currentInput);
		const hasSearch = hasSearchInput(currentInput);

		const response = await apiRequest.call(this, 'POST', API_PATHS.getFriendList);
		const friendData = parseFriendList(response);

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

		const finalOptions = cleanSearchValues(processedOptions);
		return finalOptions;
	} catch (error) {
		const currentInput = getCurrentInput(this, 'user_id', '');
		return handleError(error, currentInput, '获取好友列表时出错', 'qq');
	}
}
