/** File: en.js
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

/** Variable: Candy.View.Translation.en
 * English translation
 */
Candy.View.Translation.en = {
	'status': 'Status: %s',
	'statusConnecting': 'Connecting...',
	'statusConnected' : 'Connected',
	'statusDisconnecting': 'Disconnecting...',
	'statusDisconnected' : 'Disconnected',
	'statusAuthfail': 'Authentication failed',

	'roomSubject'  : 'Subject:',
	'messageSubmit': 'Send',

	'labelUsername': 'Username:',
	'labelNickname': 'Nickname:',
	'labelPassword': 'Password:',
	'loginSubmit'  : 'Login',
	'loginInvalid'  : 'Invalid JID',

	'reason'				: 'Reason:',
	'subject'				: 'Subject:',
	'reasonWas'				: 'Reason was: %s.',
	'kickActionLabel'		: 'Kick',
	'youHaveBeenKickedBy'   : 'You have been kicked from %2$s by %1$s',
	'youHaveBeenKicked'     : 'You have been kicked from %s',
	'banActionLabel'		: 'Ban',
	'youHaveBeenBannedBy'   : 'You have been banned from %1$s by %2$s',
	'youHaveBeenBanned'     : 'You have been banned from %s',

	'privateActionLabel' : 'Private chat',
	'ignoreActionLabel'  : 'Ignore',
	'unignoreActionLabel' : 'Unignore',

	'setSubjectActionLabel': 'Change Subject',

	'administratorMessageSubject' : 'Administrator',

	'userJoinedRoom'           : '%s joined the room.',
	'userLeftRoom'             : '%s left the room.',
	'userHasBeenKickedFromRoom': '%s has been kicked from the room.',
	'userHasBeenBannedFromRoom': '%s has been banned from the room.',
	'userChangedNick': '%1$s has changed his nickname to %2$s.',

	'presenceUnknownWarningSubject': 'Notice:',
	'presenceUnknownWarning'       : 'This user might be offline. We can\'t track his presence.',

	'dateFormat': 'dd.mm.yyyy',
	'timeFormat': 'HH:MM:ss',

	'tooltipRole'			: 'Moderator',
	'tooltipIgnored'		: 'You ignore this user',
	'tooltipEmoticons'		: 'Emoticons',
	'tooltipSound'			: 'Play sound for new private messages',
	'tooltipAutoscroll'		: 'Autoscroll',
	'tooltipStatusmessage'	: 'Display status messages',
	'tooltipAdministration'	: 'Room Administration',
	'tooltipUsercount'		: 'Room Occupants',

	'enterRoomPassword' : 'Room "%s" is password protected.',
	'enterRoomPasswordSubmit' : 'Join room',
	'passwordEnteredInvalid' : 'Invalid password for room "%s".',

	'nicknameConflict': 'Username already in use. Please choose another one.',

	'errorMembersOnly': 'You can\'t join room "%s": Insufficient rights.',
	'errorMaxOccupantsReached': 'You can\'t join room "%s": Too many occupants.',
	'errorAutojoinMissing': 'No autojoin parameter set in configuration. Please set one to continue.',

	'antiSpamMessage' : 'Please do not spam. You have been blocked for a short-time.'
};