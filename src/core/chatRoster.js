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
 */
'use strict';

/* global Candy */

var $ = window.jQuery;

/** Class: Candy.Core.ChatRoster
 * Chat Roster
 */
Candy.Core.ChatRoster = function (roomJid) {
	/** Object: items
	 * Roster items
	 */
	this.items = {};

  /** String: roomJid
   * The jid of the room this roster belongs to.
   */
  this.roomJid = roomJid || null;
};

/** Function: add
 * Add user to roster
 *
 * Parameters:
 *   (Candy.Core.ChatUser) user - User to add
 */
Candy.Core.ChatRoster.prototype.add = function(user) {
	this.items[user.getJid()] = user;

  var evtData = {
    user: user,
    roomJid: this.roomJid
  };

  /** Event: candy:roster.user.after-add
   * After initialising a room
   *
   * Parameters:
   *   (ChatUser Object) user - the user that was added
   *   (String) roomJid - the jid of the room the user is being added to
   */
  $(Candy).triggerHandler('candy:roster.user.after-add', evtData);
};

/** Function: remove
 * Remove user from roster
 *
 * Parameters:
 *   (String) jid - User jid
 */
Candy.Core.ChatRoster.prototype.remove = function(jid) {
	delete this.items[jid];

  var evtData = {
    userJid: jid,
    roomJid: this.roomJid
  };

  /** Event: candy:roster.user.after-add
   * After initialising a room
   *
   * Parameters:
   *   (String) userJid - the user that was added
   *   (String) roomJid - the jid of the room the user is being added to
   */
  $(Candy).triggerHandler('candy:roster.user.after-remove', evtData);
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
