/**
 * 接口路径常量（统一管理所有接口端点）
 */
export const API_PATHS = {

	// 获取好友列表
	getFriendList: 'get_friend_list',

	// 获取群列表
	getGroupList: 'get_group_list',

	// 获取群成员列表
	getGroupMemberList: 'get_group_member_list',

	// 点赞
	sendLike: 'send_like',

	// 发送戳一戳
	sendPoke: 'send_poke',

	// 获取机器人在线状态
	getLoginInfo : 'get_login_info',

	// 群禁言
	setGroupBan: 'set_group_ban',

	// 全体禁言
	setGroupWholeBan: 'set_group_whole_ban',

	// 群踢人
	setGroupKick: 'set_group_kick',

	// 退群
	setGroupLeave: 'set_group_leave',

	// 删除好友
	deleteFriend: 'delete_friend',

	// 群打卡
	sendGroupSign: 'set_group_sign',

	// 设置管理员
	setGroupAdmin: 'set_group_admin',
};
