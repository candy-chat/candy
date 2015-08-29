/** File: chatRoom.js
 * Candy - Chats are not dead yet.
 *
 * Legal: See the LICENSE file at the top-level directory of this distribution and at https://github.com/candy-chat/candy/blob/master/LICENSE
 */
'use strict';

import Strophe from 'strophe';

import Core from '../core.js';

/** Class: Candy.Core.ChatRoom
 * Candy Chat Room
 *
 * Parameters:
 *   (String) roomJid - Room jid
 */
var ChatRoom = function(roomJid) {
	/** Object: room
	 * Object containing roomJid and name.
	 */
	this.room = {
		jid: roomJid,
		name: Strophe.getNodeFromJid(roomJid)
	};

	/** Variable: user
	 * Current local user of this room.
	 */
	this.user = null;

	/** Variable: Roster
	 * Candy.Core.ChatRoster instance
	 */
	this.roster = new Core.ChatRoster();
};

/** Function: setUser
 * Set user of this room.
 *
 * Parameters:
 *   (Candy.Core.ChatUser) user - Chat user
 */
ChatRoom.prototype.setUser = function(user) {
	this.user = user;
};

/** Function: getUser
 * Get current local user
 *
 * Returns:
 *   (Object) - Candy.Core.ChatUser instance or null
 */
ChatRoom.prototype.getUser = function() {
	return this.user;
};

/** Function: getJid
 * Get room jid
 *
 * Returns:
 *   (String) - Room jid
 */
ChatRoom.prototype.getJid = function() {
	return this.room.jid;
};

/** Function: setName
 * Set room name
 *
 * Parameters:
 *   (String) name - Room name
 */
ChatRoom.prototype.setName = function(name) {
	this.room.name = name;
};

/** Function: getName
 * Get room name
 *
 * Returns:
 *   (String) - Room name
 */
ChatRoom.prototype.getName = function() {
	return this.room.name;
};

/** Function: setRoster
 * Set roster of room
 *
 * Parameters:
 *   (Candy.Core.ChatRoster) roster - Chat roster
 */
ChatRoom.prototype.setRoster = function(roster) {
	this.roster = roster;
};

/** Function: getRoster
 * Get roster
 *
 * Returns
 *   (Candy.Core.ChatRoster) - instance
 */
ChatRoom.prototype.getRoster = function() {
	return this.roster;
};

export default ChatRoom;
