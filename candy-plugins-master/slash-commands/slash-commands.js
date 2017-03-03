/** File: candy.js
 * Make several Candy actions accessible via the message box when prefixed with a slash "/"
 *
 * Authors:
 *	- Ben Klang <bklang@mojolingo.com>
 *
 * Contributors:
 *	- Troy McCabe <troy.mccabe@geeksquad.com>
 *	- Jonatan Männchen <jonatan.maennchen@amiadogroup.com>
 *	- Sudrien <_+github@sudrien.net>
 *
 * Copyright:
 *	- (c) 2014 Mojo Lingo LLC. All rights reserved.
 */

/* global alert, Candy, jQuery, $build */

var CandyShop = (function(self) { return self; }(CandyShop || {}));

CandyShop.SlashCommands = (function(self, Candy, $) {
	/** Object: about
	 * About SlashCommands plugin
	 *
	 * Contains:
	 *    (String) name - Candy Plugin SlashCommands
	 *    (Float) version - Candy Plugin Available Rooms version
	 */
	self.about = {
		name: 'Candy Plugin SlashCommands',
		version: '0.2.0'
	};

	self.commands = [
		'join',
		'part',
		'clear',
		'topic',
		'available',
		'away',
		'dnd',
		'nick',
		'leave',
		'invite',
		'kick'
	];

	/* This is not a command. me-does can handle /me formatting */
	self.passthrough = [
		'me',
	];

	self.defaultConferenceDomain = null;

	/** Function: init
	 * Initializes the Slash Commands plugin with the default settings.
	 */
	self.init = function(){

		$(Candy).on('candy:view.connection.status-5', self.setDefaultConferenceDomain);
		$(Candy).on('candy:view.connection.status-8', self.setDefaultConferenceDomain);

		$(Candy).bind('candy:view.message.before-send', function(e, args) {
			try {
				// (strip colors)
				var input = args.message.replace(/\|c:\d+\|/, '');

				if (input[0] !== '/') {
					return;
				}
				var match = input.match(/^\/([^\s]+)(?:\s+(.*))?$/m);
				if (match === null) {
					return;
				}

				var command = match[1];
				var data = match[2];

				// pass though some commands, they only merit formatting elsewhere
				if ($.inArray(command, self.passthrough) !== -1) { }
					// Match only whitelisted commands
				else if ($.inArray(command, self.commands) !== -1) {
					self[command](data);
					args.message = '';
				}
				else {
					Candy.View.Pane.Chat.onInfoMessage(self.currentRoom(), '', "Invalid command: " + command);
					args.message = '';
				}

			} catch (ex) {
				// Without an exception catcher, the page will reload and the user will be logged out
				Candy.Core.log(ex);
			}
		});
	};

	/** Function: join
	 * Joins a room
	 *
	 * Parameters:
	 *    (String) args The name of the room and the optional password, separated by a space
	 */
	self.join = function(args) {
		if(args === undefined || args === ''){
			Candy.View.Pane.Chat.onInfoMessage(self.currentRoom(), '', "usage: /join room OR /join room roomPassword");
			return false;
		}
		args = args.trim().split(' ');

		var room = args[0];
		var password = args[1];

		if(room === undefined || room === null || room === '') {
			return;
		}

		if(room.indexOf("@") === -1) {
			room += self.defaultConferenceDomain;
		}

		if (password === undefined || password === null || password === '') {
			Candy.Core.Action.Jabber.Room.Join(room);
		}

		Candy.Core.Action.Jabber.Room.Join(room, password);
	};


	/** Function: nick
	 * Sets Nickname
	 *
	 * Parameters:
	 *    (String) args The name of the room and the optional password, separated by a space
	 */
	self.nick = function(args) {
		if(args === undefined || args === null || args === '') {
			Candy.View.Pane.Chat.onInfoMessage(self.currentRoom(), '', "usage: /nick newNickname");
			return;
		}

		Candy.Core.Action.Jabber.SetNickname(args);
	};

	/** Function: part
	 * Exits the current chat room
	 *
	 */
	self.part = function() {
		Candy.Core.Action.Jabber.Room.Leave(self.currentRoom());
	};

	/** Function: leave
	 * /part alias
	 *
	 */
	self.leave = function() {
		self.part();
	};

	/** Function: topic
	 * Sets the topic (subject) for the current chat room
	 *
	 * Parameters:
	 *    (String) topic The new topic for the room
	 */
	self.topic = function(topic) {
		// this may not actually set the topic. it's up to the server to notify if that is the case.
		Candy.Core.Action.Jabber.Room.Admin.SetSubject(self.currentRoom(), topic);
	};

	/** Function: clear
	 * Clear the current room's scrollback
	 */
	self.clear = function() {
		$('.room-pane:visible').find('.message-pane').empty();
	};

	/** Function: available
	 * Change the current user's XMPP status to "available" with an optional message
	 * Parameters:
	 *    (String) message Optional message to set with availability
	 */
	self.available = function() {
		// TODO: The message field is currently unsupported by Candy.Core.Action.Jabber.Presence
		Candy.Core.Action.Jabber.Presence();
	};

	/** Function: away
	 * Change the current user's XMPP status to "away" with an optional message
	 * Parameters:
	 *    (String) message Optional message to set with availability
	 */
	self.away = function() {
		// TODO: The message field is currently unsupported by Candy.Core.Action.Jabber.Presence
		Candy.Core.Action.Jabber.Presence(null, $build('show', 'away'));
	};

	/** Function: dnd
	 * Change the current user's XMPP status to "dnd" with an optional message
	 * Parameters:
	 *    (String) message Optional message to set with availability
	 */
	self.dnd = function() {
		// TODO: The message field is currently unsupported by Candy.Core.Action.Jabber.Presence
		Candy.Core.Action.Jabber.Presence(null, $build('show', 'dnd'));
	};

	/** Function: invite
	 * invite another user to the current chat room, with lookups for real room & user jids
	 *
	 *Parameters:
	 *    (String) user Nickname of user, or JID - all currently connected rooms will be checked
	 *    (String) room Optional room name, must already exist
	 *    (String) password Optional room password, if room requires one
	 */
	self.invite = function(args) {
		if(args === undefined || args === null || args === ''){
			Candy.View.Pane.Chat.onInfoMessage(self.currentRoom(), '', "usage: /invite user (from the room) OR /invite &lt;user&gt; room roomPassword");
			return false;
		}
		argsRegex = args.match(/\<(.+)\>(.*)/);

		var userJid = null;

		if(argsRegex === null){
			var userText = args;
			var user = new RegExp("^" + userText + "$", "i");
			var room = null;
			var password = null;
			var roomJid = self.currentRoom();
		}
		else {
			var userText = argsRegex[1];
			var user = new RegExp("^" + userText + "$", "i");
			var roomText = argsRegex[2].trim().split(' ')[0];
			var room = new RegExp("^" + roomText + "$", "i");
			var password = argsRegex[2].trim().split(' ')[1];
			var roomJid = null;
		}

		// loop through all rooms with current connections
		$.each(Candy.Core.getRooms(), function(roomName, roomData) {
			if( !roomJid && roomData && roomData.room.name.match(room) ) {
				roomJid = roomName;
				}

			if( !roomJid && roomName.match(room) ) {
				roomJid = roomName;
				}

			// loop through all users in a room
			// compare jids, nicks and previous nicks
			$.each(roomData.roster.getAll(), function(userName, userData) {
				if( !userJid && userData.getJid().match(user) ) {
					userJid = userData.data.jid;
					}
				if( !userJid && userData.getNick().match(user) ){
					userJid = userData.data.jid;
					}
				if( !userJid && userData.getPreviousNick() !== undefined && userData.getPreviousNick().match(user) ) {
					userJid = userData.data.jid;
					}
				});
			});

		 // ok, that's all the checks.

		if(userJid === undefined || userJid === null || userJid === '') {
			Candy.View.Pane.Chat.onInfoMessage(self.currentRoom(), '', "Could not find " + userText + " to invite");
			return;
		}

		if(roomJid === undefined || roomJid === null || roomJid === '') {
			Candy.View.Pane.Chat.onInfoMessage(self.currentRoom(), '', "Could not find room " + roomText);
			return;
		}

		if(roomJid === self.currentRoom() && (password=== undefined || password === null || password === '')) {
			Candy.View.Pane.Chat.onInfoMessage(self.currentRoom(), '', "Invited " + userJid + " to " + self.currentRoom());
			var stanza = $msg({'from': Candy.Core.getUser().data.jid, 'to': userJid, 'xmlns': 'jabber:client'}).c('x', {'xmlns': 'jabber:x:conference', 'jid': self.currentRoom()});
			Candy.Core.getConnection().send(stanza.tree());
			return;
		}

		if(password=== undefined || password === null || password === '') {
			Candy.View.Pane.Chat.onInfoMessage(self.currentRoom(), '', "Invited " + userJid + " to " + roomJid);
			var stanza = $msg({'from': Candy.Core.getUser().data.jid, 'to': userJid, 'xmlns': 'jabber:client'}).c('x', {'xmlns': 'jabber:x:conference', 'jid': roomJid});
			Candy.Core.getConnection().send(stanza.tree());
			return;
		}

		Candy.View.Pane.Chat.onInfoMessage(self.currentRoom(), '', "Invited " + userJid + " to " + roomJid + " (with password)");
		var stanza = $msg({'from': Candy.Core.getUser().data.jid, 'to': userJid, 'xmlns': 'jabber:client'}).c('x', {'xmlns': 'jabber:x:conference', 'jid': roomJid});
		stanza.c("password").t(password);
		Candy.Core.getConnection().send(stanza.tree());

	};

	/** Function: kick
	 * Kick user from current room. Admins only.
	 *
	 * Parameters:
	 *    (String) user Nickname of user, or JID - all currently connected rooms will be checked
	 *    (String) comment Optional comment as to why they were kicked
	 */
	self.kick = function(args) {
		if(args === undefined || args === null || args === ''){
			Candy.View.Pane.Chat.onInfoMessage(self.currentRoom(), '', "usage: /kick nickname OR /kick &lt;nickname&gt; comment");
			return false;
		}
		argsRegex = args.match(/\<(.+)\>(.*)/);

		var userJid = null;

		if(argsRegex === null){
			var user = new RegExp("^" + args + "$", "i");
			var comment = null;
		}
		else {
			var user = new RegExp("^" + argsRegex[1] + "$", "i");
			var comment = argsRegex[2].trim();
		}

		$.each(Candy.Core.getRooms()[self.currentRoom()].roster.getAll(), function(userName, userData) {
			if( !userJid && userData.getJid().match(user) ) {
				userJid = userData.data.jid;
				}
			if( !userJid && userData.getNick().match(user) ){
				userJid = userData.data.jid;
				}
			if( !userJid && userData.getPreviousNick() !== undefined && userData.getPreviousNick().match(user) ) {
				userJid = userData.data.jid;
				}
			});

		if(userJid === undefined || userJid === null || userJid === '') {
			return;
		}

		if(comment === null || comment === '') {
			Candy.Core.Action.Jabber.Room.Admin.UserAction(self.currentRoom(), userJid, "kick");
		}

		Candy.Core.Action.Jabber.Room.Admin.UserAction(self.currentRoom(), userJid, "kick", comment);
	};


	/** Function: currentRoom
	 * Helper function to get the current room
	 */
	self.currentRoom = function() {
		return Candy.View.getCurrent().roomJid;
	};

	self.setDefaultConferenceDomain = function() {
		// When connected to the server, default the conference domain if unspecified
		if (!self.defaultConferenceDomain) {
			self.defaultConferenceDomain = "@conference." + Candy.Core.getConnection().domain;
		}

		// Ensure we have a leading "@"
		if (self.defaultConferenceDomain.indexOf('@') === -1) {
			self.defaultConferenceDomain = "@" + self.defaultConferenceDomain;
		}
	};

	return self;
}(CandyShop.SlashCommands || {}, Candy, jQuery));
