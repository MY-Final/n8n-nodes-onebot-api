import { AllEntities, Entity, PropertiesOf } from 'n8n-workflow';

/**
 * OneBot协议接口映射表
 * 按功能模块分类定义OneBot支持的接口动作
 * 键：功能模块名称，值：该模块下的具体接口动作名称联合类型
 */
export type OneBotMap = {
	bot: 'get_login_info';
	friend: 'get_stranger_info' | 'get_friend_list' | 'send_like' | 'send_poke';
	group: 'get_group_info' | 'get_group_list' | 'get_group_member_info' | 'get_group_member_list' | 'send_poke' | 'mute_user' | 'mute_all' | 'set_group_ban' | 'set_group_whole_ban' | 'kick_user' | 'group_leave' | 'delete_friend';
	message: 'send_group_msg' | 'send_private_msg';
	misc: 'get_status' | 'get_version_info';
};

/**
 * 所有OneBot动作的联合类型
 * 包含OneBotMap中所有模块下的所有接口动作名称
 * 示例值：'get_login_info' | 'get_friend_list' | 'send_group_msg' 等
 */
export type OneBotAction = AllEntities<OneBotMap>;
export type OneBotProperties = PropertiesOf<OneBotAction>;

export type BotAction = Entity<OneBotMap, 'bot'>;
export type BotProperties = PropertiesOf<BotAction>;

export type MessageAction = Entity<OneBotMap, 'message'>;
export type MessageProperties = PropertiesOf<MessageAction>;

export type FriendAction = Entity<OneBotMap, 'friend'>;
export type FriendProperties = PropertiesOf<FriendAction>;

export type GroupAction = Entity<OneBotMap, 'group'>;
export type GroupProperties = PropertiesOf<GroupAction>;

export type MiscAction = Entity<OneBotMap, 'misc'>;
export type MiscProperties = PropertiesOf<MiscAction>;

/**
 * 登录信息接口（get_login_info）的返回数据结构
 * 对应OneBot协议中获取机器人登录信息的返回结果
 */
export interface LoginInfo {
	user_id: number;
	nickname: string;
}
