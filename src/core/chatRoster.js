/** File: chatRoster.js
 * Candy - Chats are not dead yet.
 *
 * Legal: See the LICENSE file at the top-level directory of this distribution and at https://github.com/candy-chat/candy/blob/master/LICENSE
 */
'use strict';

/** Class: ChatRoster
 * Chat Roster
 */
var ChatRoster = function () {
	/** Object: items
	 * Roster items
	 */
	this.items = {};
};

/** Function: add
 * Add user to roster
 *
 * Parameters:
 *   (ChatUser) user - User to add
 */
ChatRoster.prototype.add = function(user) {
	this.items[user.getJid()] = user;
};

/** Function: remove
 * Remove user from roster
 *
 * Parameters:
 *   (String) jid - User jid
 */
ChatRoster.prototype.remove = function(jid) {
	delete this.items[jid];
};

/** Function: get
 * Get user from roster
 *
 * Parameters:
 *   (String) jid - User jid
 *
 * Returns:
 *   (ChatUser) - User
 */
ChatRoster.prototype.get = function(jid) {
	return this.items[jid];
};

/** Function: getAll
 * Get all items
 *
 * Returns:
 *   (Object) - all roster items
 */
ChatRoster.prototype.getAll = function() {
	return this.items;
};

export default ChatRoster;
