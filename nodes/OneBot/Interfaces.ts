import { AllEntities, Entity, PropertiesOf } from 'n8n-workflow';

/**
 * OneBot API资源和操作映射
 * 定义了各个资源类型支持的操作
 */
export type OneBotMap = {
	bot: 
		| 'get_login_info';     // 获取登录信息
	friend: 
		| 'get_stranger_info'   // 获取陌生人信息
		| 'get_friend_list'     // 获取好友列表
		| 'send_like';          // 发送好友赞
	group: 
		| 'get_group_info'        // 获取群信息
		| 'get_group_list'        // 获取群列表
		| 'get_group_member_info' // 获取群成员信息
		| 'get_group_member_list' // 获取群成员列表
		| 'set_group_kick'        // 踢出群成员
		| 'set_group_ban'         // 群成员禁言
		| 'set_group_whole_ban'   // 全员禁言
		| 'set_group_name'        // 设置群名称
		| 'set_group_admin';      // 设置群管理员
	message: 
		| 'send_group_msg'     // 发送群消息
		| 'send_private_msg';  // 发送私聊消息
	misc: 
		| 'get_status'        // 获取状态
		| 'get_version_info'; // 获取版本信息
};

// 基础操作类型定义
export type OneBotAction = AllEntities<OneBotMap>;
export type OneBotProperties = PropertiesOf<OneBotAction>;

// 机器人操作类型定义
export type BotAction = Entity<OneBotMap, 'bot'>;
export type BotProperties = PropertiesOf<BotAction>;

// 消息操作类型定义
export type MessageAction = Entity<OneBotMap, 'message'>;
export type MessageProperties = PropertiesOf<MessageAction>;

// 好友操作类型定义
export type FriendAction = Entity<OneBotMap, 'friend'>;
export type FriendProperties = PropertiesOf<FriendAction>;

// 群操作类型定义
export type GroupAction = Entity<OneBotMap, 'group'>;
export type GroupProperties = PropertiesOf<GroupAction>;

// 杂项操作类型定义
export type MiscAction = Entity<OneBotMap, 'misc'>;
export type MiscProperties = PropertiesOf<MiscAction>;

/**
 * 登录信息接口
 */
export interface LoginInfo {
	user_id: number;   // 机器人QQ号
	nickname: string;  // 机器人昵称
}
