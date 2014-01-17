/** File: cn.js
 * Candy - Chats are not dead yet.
 *
 * Authors:
 *   - Patrick Stadler <patrick.stadler@gmail.com>
 *   - Michael Weibel <michael.weibel@gmail.com>
 *
 * Copyright:
 *   (c) 2011 Amiado Group AG. All rights reserved.
 *   (c) 2012-2014 Patrick Stadler & Michael Weibel. All rights reserved.
 */
'use strict';

/* global Candy */

/** Variable: Candy.View.Translation.cn
 * Chinese translation
 */
Candy.View.Translation.cn = {
	'status': '状态: %s',
	'statusConnecting': '连接中...',
	'statusConnected': '已连接',
	'statusDisconnecting': '断开连接中...',
	'statusDisconnected': '已断开连接',
	'statusAuthfail': '认证失败',

	'roomSubject': '主题:',
	'messageSubmit': '发送',

	'labelUsername': '用户名:',
	'labelPassword': '密码:',
	'loginSubmit': '登录',
	'loginInvalid': '用户名不合法',

	'reason': '原因:',
	'subject': '主题:',
	'reasonWas': '原因是: %s.',
	'kickActionLabel': '踢除',
	'youHaveBeenKickedBy': '你在 %1$s 被管理者 %2$s 请出房间',
	'banActionLabel': '禁言',
	'youHaveBeenBannedBy': '你在 %1$s 被管理者 %2$s 禁言',

	'privateActionLabel': '单独对话',
	'ignoreActionLabel': '忽略',
	'unignoreActionLabel': '不忽略',

	'setSubjectActionLabel': '变更主题',

	'administratorMessageSubject': '管理员',

	'userJoinedRoom': '%s 加入房间',
	'userLeftRoom': '%s 离开房间',
	'userHasBeenKickedFromRoom': '%s 被请出这个房间',
	'userHasBeenBannedFromRoom': '%s 被管理者禁言',

	'presenceUnknownWarningSubject': '注意:',
	'presenceUnknownWarning': '这个会员可能已经下线，不能追踪到他的连接信息',

	'dateFormat': 'dd.mm.yyyy',
	'timeFormat': 'HH:MM:ss',

	'tooltipRole': '管理',
	'tooltipIgnored': '你忽略了这个会员',
	'tooltipEmoticons': '表情',
	'tooltipSound': '新消息发音',
	'tooltipAutoscroll': '滚动条',
	'tooltipStatusmessage': '禁用状态消息',
	'tooltipAdministration': '房间管理',
	'tooltipUsercount': '房间占有者',

	'enterRoomPassword': '登录房间 "%s" 需要密码.',
	'enterRoomPasswordSubmit': '加入房间',
	'passwordEnteredInvalid': '登录房间 "%s" 的密码不正确',

	'nicknameConflict': '用户名已经存在，请另选一个',

	'errorMembersOnly': '您的权限不够，不能登录房间 "%s" ',
	'errorMaxOccupantsReached': '房间 "%s" 的人数已达上限，您不能登录',

	'antiSpamMessage': '因为您在短时间内发送过多的消息 服务器要阻止您一小段时间。'
};