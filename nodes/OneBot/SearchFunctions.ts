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
		// 获取当前输入的值
		const currentInput = getCurrentInput(this, 'user_id', '');
		console.log('getFriendList - 当前输入的user_id值:', currentInput);

		// 检查是否输入了有效的QQ号
		const isValidQQNumber = isValidNumber(currentInput);
		// 是否有任何搜索输入
		const hasSearch = hasSearchInput(currentInput);

		// 获取好友列表
		const response = await apiRequest.call(this, 'POST', API_PATHS.getFriendList);
		let friendData = [];

		if (response && typeof response === 'object') {
			if (response.data && Array.isArray(response.data)) {
				friendData = response.data;
			}
		}

		// 如果没有好友数据
		if (!friendData || friendData.length === 0) {
			console.log('未找到好友数据');
			return handleEmptyData(isValidQQNumber, currentInput, '未找到好友', 'qq');
		}

		console.log(`成功获取到 ${friendData.length} 个好友`);

		// 构建好友选项
		const friendOptions: SearchableOption[] = friendData.map((info: any) => {
			const userId = info.user_id;
			const nickname = info.nickname || '未知昵称';
			const remark = info.remark || '';

			// 使用备注名（如果有）作为显示名称，否则使用昵称
			const displayName = remark || nickname;

			return {
				name: `${displayName} (QQ: ${userId})`,
				value: userId,
				description: `QQ: ${userId}`,
				// 添加搜索用的标签
				searchValues: {
					displayName: displayName.toLowerCase(),
					userId: userId.toString().toLowerCase(),
				},
			};
		});

		// 处理搜索和过滤
		const processedOptions = processSearchAndFilter(
			friendOptions,
			currentInput,
			isValidQQNumber,
			hasSearch,
			['displayName', 'userId'],
			'qq',
		);

		// 在返回前删除searchValues属性
		const finalOptions = cleanSearchValues(processedOptions);

		console.log(`最终返回 ${finalOptions.length} 个有效的好友选项`);
		return finalOptions;
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
		// 获取当前输入的值
		const currentInput = getCurrentInput(this, 'group_id', '');
		console.log('getGroupList - 当前输入的group_id值:', currentInput);

		// 检查是否输入了有效的群号
		const isValidGroupNumber = isValidNumber(currentInput);
		// 是否有任何搜索输入
		const hasSearch = hasSearchInput(currentInput);

		// 获取群列表
		const response = await apiRequest.call(this, 'POST', API_PATHS.getGroupList);
		let groupData = [];

		if (response && typeof response === 'object') {
			if (response.data && Array.isArray(response.data)) {
				groupData = response.data;
			}
		}

		// 如果没有群数据
		if (!groupData || groupData.length === 0) {
			console.log('未找到群数据');
			return handleEmptyData(isValidGroupNumber, currentInput, '未找到群', 'group');
		}

		console.log(`成功获取到 ${groupData.length} 个群`);

		// 构建群选项
		const groupOptions: SearchableOption[] = groupData.map((info: any) => {
			const groupId = info.group_id;
			const groupName = info.group_name || '未知群名称';

			return {
				name: `${groupName} (群号: ${groupId})`,
				value: groupId,
				description: `群号: ${groupId}`,
				// 添加搜索用的标签
				searchValues: {
					groupName: groupName.toLowerCase(),
					groupId: groupId.toString().toLowerCase(),
				},
			};
		});

		// 处理搜索和过滤
		const processedOptions = processSearchAndFilter(
			groupOptions,
			currentInput,
			isValidGroupNumber,
			hasSearch,
			['groupName', 'groupId'],
			'group',
		);

		// 在返回前删除searchValues属性
		const finalOptions = cleanSearchValues(processedOptions);

		console.log(`最终返回 ${finalOptions.length} 个有效的群选项`);
		return finalOptions;
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
		// 更安全地获取group_id参数
		let group_id;
		try {
			// 尝试获取group_id，可能会抛出异常
			group_id = this.getNodeParameter('group_id');
			console.log('获取到group_id:', group_id, '类型:', typeof group_id);
		} catch (error) {
			console.log('获取group_id失败:', error instanceof Error ? error.message : String(error));
			// 捕获异常并返回提示信息
			return [
				{
					name: '请先选择群组',
					value: '',
					description: '需要先在"Group Name or ID"字段中选择一个群组',
				},
			];
		}

		// 确保有效的群ID
		if (group_id === undefined || group_id === null || group_id === '') {
			console.log('group_id无效或为空');
			return [
				{
					name: '请先选择群组',
					value: '',
					description: '需要先在"Group Name or ID"字段中选择一个群组',
				},
			];
		}

		// 获取当前输入的值
		const currentInput = getCurrentInput(this, 'user_id', '');
		console.log('当前输入的user_id值:', currentInput);

		// 检查是否输入了有效的QQ号
		const isValidQQNumber = isValidNumber(currentInput);
		// 是否有任何搜索输入
		const hasSearch = hasSearchInput(currentInput);

		// 使用与其他函数相同的请求方式
		console.log('正在调用API获取群成员列表, 群ID:', group_id);

		// 构建查询参数
		const query = { group_id };

		// 使用标准apiRequest函数发送请求
		const response = await apiRequest.call(this, 'POST', API_PATHS.getGroupMemberList, undefined, query);
		console.log('API响应类型:', typeof response, '是否为数组:', Array.isArray(response));

		// 处理不同响应格式：
		// 1. { data: [...] } 标准格式
		// 2. [...] 直接返回数组格式
		let memberData = [];

		if (response && typeof response === 'object') {
			if (Array.isArray(response)) {
				// API直接返回了数组格式
				memberData = response;
				console.log('API返回了数组格式的成员数据');
			} else if (response.data && Array.isArray(response.data)) {
				// 标准格式 { data: [...] }
				memberData = response.data;
				console.log('API返回了标准格式的成员数据');
			} else {
				// 尝试从其他字段获取成员列表
				const possibleDataFields = ['result', 'members', 'list', 'member_list'];
				for (const field of possibleDataFields) {
					if (response[field] && Array.isArray(response[field])) {
						memberData = response[field];
						console.log(`从字段 ${field} 获取到成员数据`);
						break;
					}
				}
			}
		}

		// 检查处理后的成员数据
		if (!memberData || memberData.length === 0) {
			console.log('未找到有效的群成员数据');
			return handleEmptyData(isValidQQNumber, currentInput, '未找到群成员', 'qq');
		}

		console.log(`成功获取到${memberData.length}个群成员`);
		// 打印前三个成员数据以便调试
		for (let i = 0; i < Math.min(memberData.length, 3); i++) {
			console.log(`成员 ${i + 1} 数据:`, JSON.stringify(memberData[i]));
		}

		// 检查是否有无效成员
		const validMembers = memberData.filter((info: any) => {
			const userId = info.user_id || info.userId || info.uin || info.id;
			return !!userId && userId !== '' && userId !== 0;
		});
		console.log(
			`有效成员数量: ${validMembers.length}，过滤掉 ${
				memberData.length - validMembers.length
			} 个无效成员`,
		);

		// 将角色转换为中文显示
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

		// 适配不同的字段名称
		const memberOptions: SearchableOption[] = validMembers
			.map((info: any) => {
				// 尝试获取用户ID
				const userId = info.user_id || info.userId || info.uin || info.id || '';
				if (!userId) return null; // 跳过无效的用户ID

				// 尝试获取昵称/名片
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

				// 尝试获取角色
				const role = info.role || info.permission || 'member';
				const roleLabel = getRoleLabel(role);

				return {
					name: `${displayName}${role !== 'member' ? ` (${roleLabel})` : ''} (QQ: ${userId})`,
					value: userId,
					description: `QQ: ${userId}`,
					// 添加搜索用的标签，包含昵称和QQ号
					searchValues: {
						displayName: displayName.toLowerCase(),
						userId: userId.toString().toLowerCase(),
					},
				};
			})
			.filter((item: SearchableOption | null): item is SearchableOption => item !== null);

		// 处理搜索和过滤
		const processedOptions = processSearchAndFilter(
			memberOptions,
			currentInput,
			isValidQQNumber,
			hasSearch,
			['displayName', 'userId'],
			'qq',
		);

		// 在返回前删除searchValues属性
		const finalOptions = cleanSearchValues(processedOptions);

		console.log(`最终返回 ${finalOptions.length} 个有效的成员选项`);
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
