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
	getLoginInfo: 'get_login_info',

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
	sendGroupSign: 'send_group_sign',

	// 设置管理员
	setGroupAdmin: 'set_group_admin',

	// 发送消息（统一接口）
	sendMsg: 'send_msg',

	// 发送私聊消息
	sendPrivateMsg: 'send_private_msg',

	// 发送私聊合并转发消息
	sendPrivateForwardMsg: 'send_private_forward_msg',

	// 发送群消息
	sendGroupMsg: 'send_group_msg',

	// 发送群合并转发消息
	sendGroupForwardMsg: 'send_group_forward_msg',

	// 上传群文件
	uploadGroupFile: 'upload_group_file',

	// 获取群根目录文件列表
	getGroupRootFiles: 'get_group_root_files',

	// 获取群子目录文件列表
	getGroupFilesByFolder: 'get_group_files_by_folder',

	// 获取群文件系统信息
	getGroupFileSystemInfo: 'get_group_file_system_info',

	// 获取文件信息
	getFile: 'get_file',

	// 创建群文件文件夹
	createGroupFileFolder: 'create_group_file_folder',

	// 删除群文件
	deleteGroupFile: 'delete_group_file',

	// 删除群文件夹
	deleteGroupFolder: 'delete_group_folder',

	// 移动群文件
	moveGroupFile: 'move_group_file',

	// 重命名群文件
	renameGroupFile: 'rename_group_file',
};
