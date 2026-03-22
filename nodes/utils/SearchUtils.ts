import { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';

/**
 * 搜索选项的扩展类型，包含搜索值
 */
export interface SearchableOption extends INodePropertyOptions {
	searchValues?: {
		displayName?: string;
		userId?: string;
		groupName?: string;
		groupId?: string;
		[key: string]: string | undefined;
	};
}

/**
 * 获取当前输入的值
 *
 * @param loadOptions - 加载选项函数上下文
 * @param paramName - 参数名称
 * @param defaultValue - 默认值
 * @returns 当前输入的值
 */
export function getCurrentInput(
	loadOptions: ILoadOptionsFunctions,
	paramName: string,
	defaultValue: string = '',
): string {
	try {
		const value = loadOptions.getNodeParameter(paramName, defaultValue) as string;
		return value || '';
	} catch {
		// 无法获取当前值，返回默认值
		return defaultValue;
	}
}

/**
 * 验证输入是否为有效的数字（QQ号或群号）
 *
 * @param input - 输入值
 * @returns 是否为有效的数字
 */
export function isValidNumber(input: string | undefined | null): boolean {
	return !!(input && typeof input === 'string' && /^\d+$/.test(input));
}

/**
 * 检查是否有搜索输入
 *
 * @param input - 输入值
 * @returns 是否有搜索输入
 */
export function hasSearchInput(input: string | undefined | null): boolean {
	return !!(input && typeof input === 'string' && input.trim() !== '');
}

/**
 * 创建"直接使用输入数字"的选项
 *
 * @param input - 输入的数字
 * @param type - 类型（'qq' | 'group'）
 * @returns 选项对象
 */
export function createDirectUseOption(
	input: string,
	type: 'qq' | 'group' = 'qq',
): INodePropertyOptions {
	const label = type === 'qq' ? 'QQ号' : '群号';
	return {
		name: `使用${label}: ${input}`,
		value: input,
		description: `直接使用输入的${label}`,
	};
}

/**
 * 创建带搜索值的"直接使用输入数字"选项
 *
 * @param input - 输入的数字
 * @param type - 类型（'qq' | 'group'）
 * @returns 带搜索值的选项对象
 */
export function createDirectUseOptionWithSearch(
	input: string,
	type: 'qq' | 'group' = 'qq',
): SearchableOption {
	const option = createDirectUseOption(input, type);
	return {
		...option,
		searchValues: {
			displayName: '',
			userId: type === 'qq' ? input : undefined,
			groupId: type === 'group' ? input : undefined,
		},
	};
}

/**
 * 过滤选项（根据搜索值）
 *
 * @param options - 选项列表
 * @param searchValue - 搜索值
 * @param searchFields - 要搜索的字段名数组（如 ['displayName', 'userId']）
 * @returns 过滤后的选项列表
 */
export function filterOptions(
	options: SearchableOption[],
	searchValue: string,
	searchFields: string[],
): SearchableOption[] {
	if (!searchValue) {
		return options;
	}

	const lowerSearchValue = searchValue.toLowerCase();

	return options.filter((option) => {
		if (!option.searchValues) {
			return false;
		}

		return searchFields.some((field) => {
			const fieldValue = option.searchValues?.[field];
			return fieldValue && fieldValue.includes(lowerSearchValue);
		});
	});
}

/**
 * 清理选项中的 searchValues 属性
 *
 * @param options - 带搜索值的选项列表
 * @returns 清理后的选项列表
 */
export function cleanSearchValues(options: SearchableOption[]): INodePropertyOptions[] {
	return options.map(({ name, value, description }) => ({
		name,
		value,
		description,
	}));
}

/**
 * 处理空数据情况
 *
 * @param isValidNumber - 是否为有效数字
 * @param currentInput - 当前输入值
 * @param emptyMessage - 空数据消息
 * @param type - 类型（'qq' | 'group'）
 * @returns 选项列表
 */
export function handleEmptyData(
	isValidNumber: boolean,
	currentInput: string,
	emptyMessage: string,
	type: 'qq' | 'group' = 'qq',
): INodePropertyOptions[] {
	if (isValidNumber) {
		return [createDirectUseOption(currentInput, type)];
	}

	return [
		{
			name: emptyMessage,
			value: '',
			description: emptyMessage,
		},
	];
}

/**
 * 处理错误情况
 *
 * @param error - 错误对象
 * @param currentInput - 当前输入值
 * @param errorMessage - 错误消息
 * @param type - 类型（'qq' | 'group'）
 * @returns 选项列表
 */
export function handleError(
	error: unknown,
	currentInput: string,
	errorMessage: string,
	type: 'qq' | 'group' = 'qq',
): INodePropertyOptions[] {
	void error;

	if (isValidNumber(currentInput)) {
		return [createDirectUseOption(currentInput, type)];
	}

	return [
		{
			name: '加载失败',
			value: '',
			description: errorMessage,
		},
	];
}

/**
 * 处理搜索和过滤逻辑
 *
 * @param options - 选项列表
 * @param currentInput - 当前输入值
 * @param isValidNumber - 是否为有效数字
 * @param hasSearchInput - 是否有搜索输入
 * @param searchFields - 要搜索的字段名数组
 * @param type - 类型（'qq' | 'group'）
 * @returns 处理后的选项列表
 */
export function processSearchAndFilter(
	options: SearchableOption[],
	currentInput: string,
	isValidNumber: boolean,
	hasSearchInput: boolean,
	searchFields: string[],
	type: 'qq' | 'group' = 'qq',
): SearchableOption[] {
	if (!hasSearchInput) {
		return options;
	}

	const searchValue = currentInput.toLowerCase();
	const filteredOptions = filterOptions(options, searchValue, searchFields);

	// 如果没有匹配结果，但是输入的是有效的数字，添加直接使用该数字的选项
	if (filteredOptions.length === 0 && isValidNumber) {
		return [createDirectUseOptionWithSearch(currentInput, type)];
	}

	return filteredOptions.length > 0 ? filteredOptions : options;
}
