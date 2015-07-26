/** File: chatRoom.js
 * Candy - Chats are not dead yet.
 *
 * Authors:
 *   - Patrick Stadler <patrick.stadler@gmail.com>
 *   - Michael Weibel <michael.weibel@gmail.com>
 *
 * Copyright:
 *   (c) 2011 Amiado Group AG. All rights reserved.
 *   (c) 2012-2014 Patrick Stadler & Michael Weibel. All rights reserved.
 *   (c) 2015 Adhearsion Foundation Inc <info@adhearsion.com>. All rights reserved.
 */
'use strict';

/* global Candy, Strophe */

/** Class: Candy.Core.ChatRoom
 * Candy Chat Room
 *
 * Parameters:
 *   (String) roomJid - Room jid
 */
Candy.Core.ChatRoom = function(roomJid) {
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
	this.roster = new Candy.Core.ChatRoster();
};

/** Function: setUser
 * Set user of this room.
 *
 * Parameters:
 *   (Candy.Core.ChatUser) user - Chat user
 */
Candy.Core.ChatRoom.prototype.setUser = function(user) {
	this.user = user;
};

/** Function: getUser
 * Get current local user
 *
 * Returns:
 *   (Object) - Candy.Core.ChatUser instance or null
 */
Candy.Core.ChatRoom.prototype.getUser = function() {
	return this.user;
};

/** Function: getJid
 * Get room jid
 *
 * Returns:
 *   (String) - Room jid
 */
Candy.Core.ChatRoom.prototype.getJid = function() {
	return this.room.jid;
};

/** Function: setName
 * Set room name
 *
 * Parameters:
 *   (String) name - Room name
 */
Candy.Core.ChatRoom.prototype.setName = function(name) {
	this.room.name = name;
};

/** Function: getName
 * Get room name
 *
 * Returns:
 *   (String) - Room name
 */
Candy.Core.ChatRoom.prototype.getName = function() {
	return this.room.name;
};

/** Function: setRoster
 * Set roster of room
 *
 * Parameters:
 *   (Candy.Core.ChatRoster) roster - Chat roster
 */
Candy.Core.ChatRoom.prototype.setRoster = function(roster) {
	this.roster = roster;
};

/** Function: getRoster
 * Get roster
 *
 * Returns
 *   (Candy.Core.ChatRoster) - instance
 */
Candy.Core.ChatRoom.prototype.getRoster = function() {
	return this.roster;
};
