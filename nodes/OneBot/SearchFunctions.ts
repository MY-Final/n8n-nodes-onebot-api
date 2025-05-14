import { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { apiRequest } from './GenericFunctions';

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
		// 尝试获取当前输入的值
		let currentInput = '';
		try {
			// 尝试获取当前输入的user_id，这可能会失败，因为在loadOptions阶段可能还没有值
			currentInput = this.getNodeParameter('user_id', '') as string;
			console.log('getFriendList - 当前输入的user_id值:', currentInput);
		} catch (error) {
			// 无法获取当前值，忽略错误
			console.log('无法获取当前user_id值:', error instanceof Error ? error.message : String(error));
		}

		// 检查是否输入了有效的QQ号
		const isValidQQNumber =
			currentInput && typeof currentInput === 'string' && /^\d+$/.test(currentInput);
		// 是否有任何搜索输入
		const hasSearchInput =
			currentInput && typeof currentInput === 'string' && currentInput.trim() !== '';

		// 获取好友列表
		const response = await apiRequest.call(this, 'GET', 'get_friend_list');
		let friendData = [];

		if (response && typeof response === 'object') {
			if (response.data && Array.isArray(response.data)) {
				friendData = response.data;
			}
		}

		// 如果没有好友数据
		if (!friendData || friendData.length === 0) {
			console.log('未找到好友数据');

			// 如果用户输入了QQ号，提供直接使用该QQ号的选项
			if (isValidQQNumber) {
				return [
					{
						name: `使用QQ号: ${currentInput}`,
						value: currentInput,
						description: `直接使用输入的QQ号`,
					},
				];
			}

			return [{ name: '未找到好友', value: '', description: '好友列表为空或无法获取好友列表' }];
		}

		console.log(`成功获取到 ${friendData.length} 个好友`);

		// 构建好友选项
		let friendOptions = friendData.map((info: any) => {
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

		// 如果有搜索输入，过滤选项
		if (hasSearchInput) {
			const searchValue = currentInput.toLowerCase();

			// 过滤符合搜索条件的好友（匹配昵称或QQ号）
			const filteredOptions = friendOptions.filter((option: any) => {
				return (
					option.searchValues.displayName.includes(searchValue) ||
					option.searchValues.userId.includes(searchValue)
				);
			});

			// 如果没有匹配结果，但是输入的是有效的QQ号，添加直接使用该QQ号的选项
			if (filteredOptions.length === 0 && isValidQQNumber) {
				friendOptions = [
					{
						name: `使用QQ号: ${currentInput}`,
						value: currentInput,
						description: `直接使用输入的QQ号`,
						searchValues: {
							displayName: '',
							userId: currentInput,
						},
					},
				];
			} else if (filteredOptions.length > 0) {
				friendOptions = filteredOptions;
			}
		}

		// 在返回前删除searchValues属性
		const finalOptions = friendOptions.map(
			({
				name,
				value,
				description,
			}: {
				name: string;
				value: string | number;
				description: string;
				searchValues: any;
			}) => ({
				name,
				value,
				description,
			}),
		);

		console.log(`最终返回 ${finalOptions.length} 个有效的好友选项`);
		return finalOptions;
	} catch (error) {
		console.error('获取好友列表失败:', error instanceof Error ? error.message : String(error));

		// 尝试获取当前输入的值
		let currentInput = '';
		try {
			currentInput = this.getNodeParameter('user_id', '') as string;
		} catch (error) {
			// 忽略错误
		}

		// 如果用户输入了QQ号，提供直接使用该QQ号的选项
		if (currentInput && typeof currentInput === 'string' && /^\d+$/.test(currentInput)) {
			return [
				{
					name: `使用QQ号: ${currentInput}`,
					value: currentInput,
					description: `直接使用输入的QQ号`,
				},
			];
		}

		return [
			{
				name: '加载失败',
				value: '',
				description: '获取好友列表时出错',
			},
		];
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
		// 尝试获取当前输入的值
		let currentInput = '';
		try {
			// 尝试获取当前输入的group_id，这可能会失败，因为在loadOptions阶段可能还没有值
			currentInput = this.getNodeParameter('group_id', '') as string;
			console.log('getGroupList - 当前输入的group_id值:', currentInput);
		} catch (error) {
			// 无法获取当前值，忽略错误
			console.log(
				'无法获取当前group_id值:',
				error instanceof Error ? error.message : String(error),
			);
		}

		// 检查是否输入了有效的群号
		const isValidGroupNumber =
			currentInput && typeof currentInput === 'string' && /^\d+$/.test(currentInput);
		// 是否有任何搜索输入
		const hasSearchInput =
			currentInput && typeof currentInput === 'string' && currentInput.trim() !== '';

		// 获取群列表
		const response = await apiRequest.call(this, 'GET', 'get_group_list');
		let groupData = [];

		if (response && typeof response === 'object') {
			if (response.data && Array.isArray(response.data)) {
				groupData = response.data;
			}
		}

		// 如果没有群数据
		if (!groupData || groupData.length === 0) {
			console.log('未找到群数据');

			// 如果用户输入了群号，提供直接使用该群号的选项
			if (isValidGroupNumber) {
				return [
					{
						name: `使用群号: ${currentInput}`,
						value: currentInput,
						description: `直接使用输入的群号`,
					},
				];
			}

			return [{ name: '未找到群', value: '', description: '群列表为空或无法获取群列表' }];
		}

		console.log(`成功获取到 ${groupData.length} 个群`);

		// 构建群选项
		let groupOptions = groupData.map((info: any) => {
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

		// 如果有搜索输入，过滤选项
		if (hasSearchInput) {
			const searchValue = currentInput.toLowerCase();

			// 过滤符合搜索条件的群（匹配群名称或群号）
			const filteredOptions = groupOptions.filter((option: any) => {
				return (
					option.searchValues.groupName.includes(searchValue) ||
					option.searchValues.groupId.includes(searchValue)
				);
			});

			// 如果没有匹配结果，但是输入的是有效的群号，添加直接使用该群号的选项
			if (filteredOptions.length === 0 && isValidGroupNumber) {
				groupOptions = [
					{
						name: `使用群号: ${currentInput}`,
						value: currentInput,
						description: `直接使用输入的群号`,
						searchValues: {
							groupName: '',
							groupId: currentInput,
						},
					},
				];
			} else if (filteredOptions.length > 0) {
				groupOptions = filteredOptions;
			}
		}

		// 在返回前删除searchValues属性
		const finalOptions = groupOptions.map(
			({
				name,
				value,
				description,
			}: {
				name: string;
				value: string | number;
				description: string;
				searchValues: any;
			}) => ({
				name,
				value,
				description,
			}),
		);

		console.log(`最终返回 ${finalOptions.length} 个有效的群选项`);
		return finalOptions;
	} catch (error) {
		console.error('获取群列表失败:', error instanceof Error ? error.message : String(error));

		// 尝试获取当前输入的值
		let currentInput = '';
		try {
			currentInput = this.getNodeParameter('group_id', '') as string;
		} catch (error) {
			// 忽略错误
		}

		// 如果用户输入了群号，提供直接使用该群号的选项
		if (currentInput && /^\d+$/.test(currentInput)) {
			return [
				{
					name: `使用群号: ${currentInput}`,
					value: currentInput,
					description: `直接使用输入的群号`,
				},
			];
		}

		return [
			{
				name: '加载失败',
				value: '',
				description: '获取群列表时出错',
			},
		];
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

		// 尝试获取当前输入的值
		let currentInput = '';
		try {
			// 尝试获取当前输入的user_id，这可能会失败，因为在loadOptions阶段可能还没有值
			currentInput = this.getNodeParameter('user_id', '') as string;
			console.log('当前输入的user_id值:', currentInput);
		} catch (error) {
			// 无法获取当前值，忽略错误
			console.log('无法获取当前user_id值:', error instanceof Error ? error.message : String(error));
		}

		// 检查是否输入了有效的QQ号
		const isValidQQNumber =
			currentInput && typeof currentInput === 'string' && /^\d+$/.test(currentInput);
		// 是否有任何搜索输入
		const hasSearchInput =
			currentInput && typeof currentInput === 'string' && currentInput.trim() !== '';

		// 使用与其他函数相同的请求方式
		console.log('正在调用API获取群成员列表, 群ID:', group_id);

		// 构建查询参数
		const query = { group_id };

		// 使用标准apiRequest函数发送请求
		const response = await apiRequest.call(this, 'GET', 'get_group_member_list', undefined, query);
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

			// 如果用户输入了QQ号，提供直接使用该QQ号的选项
			if (isValidQQNumber) {
				return [
					{
						name: `使用QQ号: ${currentInput}`,
						value: currentInput,
						description: `直接使用输入的QQ号`,
					},
				];
			}

			return [{ name: '未找到群成员', value: '', description: '该群没有成员或无法获取成员列表' }];
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
		let memberOptions = validMembers
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
			.filter(
				(
					item: any,
				): item is INodePropertyOptions & {
					searchValues: { displayName: string; userId: string };
				} => item !== null,
			);

		// 如果有搜索输入，过滤选项
		if (hasSearchInput) {
			const searchValue = currentInput.toLowerCase();

			// 过滤符合搜索条件的成员（匹配昵称或QQ号）
			const filteredOptions = memberOptions.filter(
				(
					option: INodePropertyOptions & { searchValues: { displayName: string; userId: string } },
				) => {
					return (
						option.searchValues.displayName.includes(searchValue) ||
						option.searchValues.userId.includes(searchValue)
					);
				},
			);

			// 如果没有匹配结果，但是输入的是有效的QQ号，添加直接使用该QQ号的选项
			if (filteredOptions.length === 0 && isValidQQNumber) {
				memberOptions = [
					{
						name: `使用QQ号: ${currentInput}`,
						value: currentInput,
						description: `直接使用输入的QQ号`,
						searchValues: {
							displayName: '',
							userId: currentInput,
						},
					},
				];
			} else if (filteredOptions.length > 0) {
				memberOptions = filteredOptions;
			}
		}

		// 在返回前删除searchValues属性，因为它不是INodePropertyOptions的一部分
		const finalOptions = memberOptions.map(
			({
				name,
				value,
				description,
			}: {
				name: string;
				value: string | number;
				description: string;
				searchValues: any;
			}) => ({
				name,
				value,
				description,
			}),
		);

		console.log(`最终返回 ${finalOptions.length} 个有效的成员选项`);
		return finalOptions;
	} catch (error) {
		console.error('获取群成员列表失败:', error instanceof Error ? error.message : String(error));

		// 尝试获取当前输入的值
		let currentInput = '';
		try {
			currentInput = this.getNodeParameter('user_id', '') as string;
		} catch (error) {
			// 忽略错误
		}

		// 如果用户输入了QQ号，提供直接使用该QQ号的选项
		if (currentInput && typeof currentInput === 'string' && /^\d+$/.test(currentInput)) {
			return [
				{
					name: `使用QQ号: ${currentInput}`,
					value: currentInput,
					description: `直接使用输入的QQ号`,
				},
			];
		}

		// 提供更友好的错误信息
		return [
			{
				name: '加载失败',
				value: '',
				description: '获取群成员列表时出错，请确保选择了有效的群组且机器人有权限访问',
			},
		];
	}
}
