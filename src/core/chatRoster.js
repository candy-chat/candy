/** File: chatRoster.js
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

/* global Candy */

/** Class: Candy.Core.ChatRoster
 * Chat Roster
 */
Candy.Core.ChatRoster = function () {
	/** Object: items
	 * Roster items
	 */
	this.items = {};
};

/** Function: add
 * Add user to roster
 *
 * Parameters:
 *   (Candy.Core.ChatUser) user - User to add
 */
Candy.Core.ChatRoster.prototype.add = function(user) {
	this.items[user.getJid()] = user;
};

/** Function: remove
 * Remove user from roster
 *
 * Parameters:
 *   (String) jid - User jid
 */
Candy.Core.ChatRoster.prototype.remove = function(jid) {
	delete this.items[jid];
};

/** Function: get
 * Get user from roster
 *
 * Parameters:
 *   (String) jid - User jid
 *
 * Returns:
 *   (Candy.Core.ChatUser) - User
 */
Candy.Core.ChatRoster.prototype.get = function(jid) {
	return this.items[jid];
};

/** Function: getAll
 * Get all items
 *
 * Returns:
 *   (Object) - all roster items
 */
Candy.Core.ChatRoster.prototype.getAll = function() {
	return this.items;
};
