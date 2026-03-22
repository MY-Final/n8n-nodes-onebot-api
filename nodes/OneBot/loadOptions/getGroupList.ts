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

interface GroupInfo {
	group_id: number | string;
	group_name?: string;
}

interface GroupListResponse {
	data?: GroupInfo[];
}

function parseGroupList(response: unknown): GroupInfo[] {
	if (!response || typeof response !== 'object') {
		return [];
	}

	const data = (response as GroupListResponse).data;
	return Array.isArray(data) ? data : [];
}

export async function getGroupList(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	try {
		const currentInput = getCurrentInput(this, 'group_id', '');
		const isValidGroupNumber = isValidNumber(currentInput);
		const hasSearch = hasSearchInput(currentInput);

		const response = await apiRequest.call(this, 'POST', API_PATHS.getGroupList);
		const groupData = parseGroupList(response);

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

		const finalOptions = cleanSearchValues(processedOptions);
		return finalOptions;
	} catch (error) {
		const currentInput = getCurrentInput(this, 'group_id', '');
		return handleError(error, currentInput, '获取群列表时出错', 'group');
	}
}
