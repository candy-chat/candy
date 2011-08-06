/** File: event.js
 * Candy - Chats are not dead yet.
 *
 * Authors:
 *   - Patrick Stadler <patrick.stadler@amiadogroup.com>
 *   - Michael Weibel <michael.weibel@amiadogroup.com>
 *
 * Copyright:
 *   (c) 2011 Amiado Group AG. All rights reserved.
 */

/** Class: Candy.Core.Event
 * Chat Events
 *
 * Parameters:
 *   (Candy.Core.Event) self - itself
 *   (Strophe) Strophe - Strophe
 *   (jQuery) $ - jQuery
 *   (Candy.Util.Observable) observable - Observable to mixin
 */
Candy.Core.Event = (function(self, Strophe, $, observable) {
	/**
	 * Mixin observable
	 */
	var i;
	for (i in observable) {
		if (observable.hasOwnProperty(i)) {
			self[i] = observable[i];
		}
	}

	/** Enum: KEYS
	 * Observer keys
	 *
	 * CHAT - Chat events
	 * PRESENCE - Presence events
	 * MESSAGE - Message events
	 * LOGIN - Login event
	 */
	self.KEYS = {
		CHAT: 1,
		PRESENCE: 2,
		MESSAGE: 3,
		LOGIN: 4
	};

	/** Class: Candy.Core.Event.Strophe
	 * Strophe-related events
	 */
	self.Strophe = {
		/** Function: Connect
		 * Acts on strophe status events and notifies view.
		 *
		 * Parameters:
		 *   (Strophe.Status) status - Strophe statuses
		 */
		Connect: function(status) {
			switch(status) {
				case Strophe.Status.CONNECTED:
					Candy.Core.log('[Connection] Connected');
					Candy.Core.Action.Jabber.GetJidIfAnonymous();
					// fall through because the same things need to be done :)
				case Strophe.Status.ATTACHED:
					Candy.Core.log('[Connection] Attached');
					Candy.Core.Action.Jabber.Presence();
					Candy.Core.Action.Jabber.Autojoin();
					Candy.Core.Action.Jabber.GetIgnoreList();
					break;

				case Strophe.Status.DISCONNECTED:
					Candy.Core.log('[Connection] Disconnected');
					break;

				case Strophe.Status.AUTHFAIL:
					Candy.Core.log('[Connection] Authentication failed');
					break;

				case Strophe.Status.CONNECTING:
					Candy.Core.log('[Connection] Connecting');
					break;

				case Strophe.Status.DISCONNECTING:
					Candy.Core.log('[Connection] Disconnecting');
					break;

				case Strophe.Status.AUTHENTICATING:
					Candy.Core.log('[Connection] Authenticating');
					break;

				case Strophe.Status.ERROR:
				case Strophe.Status.CONNFAIL:
					Candy.Core.log('[Connection] Failed (' + status + ')');
					break;

				default:
					Candy.Core.log('[Connection] What?!');
					break;
			}

			self.notifyObservers(self.KEYS.CHAT, { type: 'connection', status: status } );
		}
	};

	/** Function: Login
	 * Notify view that the login window should be displayed
	 *
	 * Parameters:
	 *   (String) presetJid - Preset user JID
	 */
	self.Login = function(presetJid) {
		self.notifyObservers(self.KEYS.LOGIN, { presetJid: presetJid } );
	};

	/** Class: Candy.Core.Event.Jabber
	 * Jabber related events
	 */
	self.Jabber = {
		/** Function: Version
		 * Responds to a version request
		 *
		 * Parameters:
		 *   (String) msg - Raw XML Message
		 *
		 * Returns:
		 *   (Boolean) - true
		 */
		Version: function(msg) {
			Candy.Core.log('[Jabber] Version');
			Candy.Core.Action.Jabber.Version($(msg));
			return true;
		},

		/** Function: Presence
		 * Acts on a presence event
		 *
		 * Parameters:
		 *   (String) msg - Raw XML Message
		 *
		 * Returns:
		 *   (Boolean) - true
		 */
		Presence: function(msg) {
			Candy.Core.log('[Jabber] Presence');
			var x = $('x', msg);
			if(x.attr('xmlns') && x.attr('xmlns').match(Strophe.NS.MUC)) {
				self.Jabber.Room.Presence(msg);
			}
			return true;
		},

		/** Function: Bookmarks
		 * Acts on a bookmarks event. When a bookmark has the attribute autojoin set, joins this room.
		 *
		 * Parameters:
		 *   (String) msg - Raw XML Message
		 *
		 * Returns:
		 *   (Boolean) - true
		 */
		Bookmarks: function(msg) {
			Candy.Core.log('[Jabber] Bookmarks');
			// Autojoin bookmarks (Openfire)
			$('conference', msg).each(function() {
				if($(this).attr('autojoin')) {
					Candy.Core.Action.Jabber.Room.Join($(this).attr('jid'));
				}
			});
			return true;
		},

		/** Function: PrivacyList
		 * Acts on a privacy list event and sets up the current privacy list of this user.
		 *
		 * Parameters:
		 *   (String) msg - Raw XML Message
		 *
		 * Returns:
		 *   (Boolean) - false to disable the handler after first call.
		 */
		PrivacyList: function(msg) {
			Candy.Core.log('[Jabber] PrivacyList');
			var currentUser = Candy.Core.getUser();
			$('list[name=ignore] item', msg).each(function() {
				var item = $(this);
				if (item.attr('action') === 'deny') {
					currentUser.addToOrRemoveFromPrivacyList('ignore', item.attr('value'));
				}
			});
			return false;
		},

		/** Function: Message
		 * Acts on room, admin and server messages and notifies the view if required.
		 *
		 * Parameters:
		 *   (String) msg - Raw XML Message
		 *
		 * Returns:
		 *   (Boolean) - true
		 */
		Message: function(msg) {
			Candy.Core.log('[Jabber] Message');
			var fromJid = $(msg).attr('from'),
				type = $(msg).attr('type'),
				toJid = $(msg).attr('to');
			// Room message
			if(fromJid !== Strophe.getDomainFromJid(fromJid) && (type === 'groupchat' || type === 'chat')) {
				self.Jabber.Room.Message(msg);
			// Admin message
			} else if(!toJid && fromJid === Strophe.getDomainFromJid(fromJid)) {
				self.notifyObservers(self.KEYS.CHAT, { type: (type || 'message'), message: $(msg).children('body').text() });
			// Server Message
			} else if(toJid && fromJid === Strophe.getDomainFromJid(fromJid)) {
				self.notifyObservers(self.KEYS.CHAT, { type: (type || 'message'), subject: $(msg).children('subject').text(), message: $(msg).children('body').text() });
			}
			return true;
		},

		/** Class: Candy.Core.Event.Jabber.Room
		 * Room specific events
		 */
		Room: {
			/** Function: Leave
			 * Leaves a room and cleans up related data and notifies view.
			 *
			 * Parameters:
			 *   (String) msg - Raw XML Message
			 *
			 * Returns:
			 *   (Boolean) - true
			 */
			Leave: function(msg) {
				Candy.Core.log('[Jabber:Room] Leave');
				var from = $(msg).attr('from'),
					roomJid = Strophe.getBareJidFromJid(from),
					roomName = Candy.Core.getRoom(roomJid).getName(),
					item = $(msg).find('item'),
					type = 'leave',
					reason,
					actor;

				delete Candy.Core.getRooms()[roomJid];
				// if user gets kicked, role is none and there's a status code 307
				if (item.attr('role') === 'none') {
					if($(msg).find('status').attr('code') === '307') {
						type = 'kick';
					} else if($(msg).find('status').attr('code') === '301') {
						type = 'ban';
					}
					reason = item.find('reason').text();
					actor  = item.find('actor').attr('jid');
				}

				var user = new Candy.Core.ChatUser(from, Strophe.getResourceFromJid(from), item.attr('affiliation'), item.attr('role'));

				self.notifyObservers(self.KEYS.PRESENCE, { 'roomJid': roomJid, 'roomName': roomName, 'type': type, 'reason': reason, 'actor': actor, 'user': user } );
				return true;
			},

			/** Function: Disco
			 * Sets informations to rooms according to the disco info received.
			 *
			 * Parameters:
			 *   (String) msg - Raw XML Message
			 *
			 * Returns:
			 *   (Boolean) - true
			 */
			Disco: function(msg) {
				Candy.Core.log('[Jabber:Room] Disco');
				var roomJid = Strophe.getBareJidFromJid($(msg).attr('from'));

				// Client joined a room
				if(!Candy.Core.getRooms()[roomJid]) {
					Candy.Core.getRooms()[roomJid] = new Candy.Core.ChatRoom(roomJid);
				}
				// Room existed but room name was unknown
				var roomName = $(msg).find('identity').attr('name'),
					room = Candy.Core.getRoom(roomJid);
				if(room.getName() === null) {
					room.setName(roomName);
				// Room name changed
				}/*else if(room.getName() !== roomName && room.getUser() !== null) {
					// NOTE: We want to notify the View here but jabber doesn't send anything when the room name changes :-(
				}*/
				return true;
			},

			/** Function: Presence
			 * Acts on various presence messages (room leaving, room joining, error presence) and notifies view.
			 *
			 * Parameters:
			 *   (String) msg - Raw XML Message
			 *
			 * Returns:
			 *   (Boolean) - true
			 */
			Presence: function(msg) {
				Candy.Core.log('[Jabber:Room] Presence');
				msg = $(msg);
				var from = msg.attr('from'),
					roomJid = Strophe.getBareJidFromJid(from),
					presenceType = msg.attr('type');

				// Client left a room
				if(Strophe.getResourceFromJid(from) === Candy.Core.getUser().getNick() && presenceType === 'unavailable') {
					self.Jabber.Room.Leave(msg);
					return true;
				}
				// Presence error: Remove room from array to prevent error when disconnecting
				// @todo maybe more handling needed here.
				if (presenceType === 'error') {
					Candy.Core.log('[Jabber:Room] Presence Error');
					delete Candy.Core.getRooms()[roomJid];
					return true;
				}

				// Client joined a room
				var room = Candy.Core.getRoom(roomJid);
				if(!room) {
					Candy.Core.getRooms()[roomJid] = new Candy.Core.ChatRoom(roomJid);
					room = Candy.Core.getRoom(roomJid);
				}
				// Room existed but user was not registered
				if(room.getUser() === null) {
					room.setUser(Candy.Core.getUser());
				}

				var roster = room.getRoster(),
					action, user,
					item = msg.find('item');
				// User joined a room
				if(presenceType !== 'unavailable') {
					user = new Candy.Core.ChatUser(from, Strophe.getResourceFromJid(from), item.attr('affiliation'), item.attr('role'));
					roster.add(user);
					action = 'join';
				// User left a room
				} else {
					action = 'leave';
					if(item.attr('role') === 'none') {
						if(msg.find('status').attr('code') === '307') {
							action = 'kick';
						} else if(msg.find('status').attr('code') === '301') {
							action = 'ban';
						}
					}
					user = roster.get(from);
					roster.remove(from);
				}

				self.notifyObservers(self.KEYS.PRESENCE, {'roomJid': roomJid, 'roomName': room.getName(), 'user': user, 'action': action, 'currentUser': Candy.Core.getUser() } );
				return true;
			},

			/** Function: Message
			 * Acts on various message events (subject changed, private chat message, multi-user chat message)
			 * and notifies view.
			 *
			 * Parameters:
			 *   (String) msg - Raw XML Message
			 *
			 * Returns:
			 *   (Boolean) - true
			 */
			Message: function(msg) {
				Candy.Core.log('[Jabber:Room] Message');
				// Room subject
				var roomJid, message;
				if($(msg).children('subject').length > 0) {
					roomJid = Strophe.getBareJidFromJid($(msg).attr('from'));
					message = { name: Strophe.getNodeFromJid(roomJid), body: $(msg).children('subject').text(), type: 'subject' };
				// Private chat message
				} else if($(msg).attr('type') === 'chat') {
					roomJid = $(msg).attr('from');
					var bareRoomJid = Strophe.getBareJidFromJid(roomJid),
						// if a 3rd-party client sends a direct message to this user (not via the room) then the username is the node and not the resource.
						isNoConferenceRoomJid = !Candy.Core.getRoom(bareRoomJid),
						name = isNoConferenceRoomJid ? Strophe.getNodeFromJid(roomJid) : Strophe.getResourceFromJid(roomJid);
					message = { name: name, body: $('body', msg).text(), type: $(msg).attr('type'), isNoConferenceRoomJid: isNoConferenceRoomJid };
				// Multi-user chat message
				} else {
					roomJid = Strophe.getBareJidFromJid($(msg).attr('from'));
					message = { name: Strophe.getResourceFromJid($(msg).attr('from')), body: $('body', msg).text(), type: $(msg).attr('type') };
				}

				var delay = $('delay', msg),
					timestamp = delay !== undefined ? delay.attr('stamp') : null;

				self.notifyObservers(self.KEYS.MESSAGE, {roomJid: roomJid, message: message, timestamp: timestamp } );
				return true;
			}
		}
	};

	return self;
}(Candy.Core.Event || {}, Strophe, jQuery, Candy.Util.Observable));
