/** File: event.js
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

/* global Candy, Strophe, jQuery */

/** Class: Candy.Core.Event
 * Chat Events
 *
 * Parameters:
 *   (Candy.Core.Event) self - itself
 *   (Strophe) Strophe - Strophe
 *   (jQuery) $ - jQuery
 */
Candy.Core.Event = (function(self, Strophe, $) {
	/** Function: Login
	 * Notify view that the login window should be displayed
	 *
	 * Parameters:
	 *   (String) presetJid - Preset user JID
	 *
	 * Triggers:
	 *   candy:core.login using {presetJid}
	 */
	self.Login = function(presetJid) {
		/** Event: candy:core.login
		 * Triggered when the login window should be displayed
		 *
		 * Parameters:
		 *   (String) presetJid - Preset user JID
		 */
		$(Candy).triggerHandler('candy:core.login', { presetJid: presetJid } );
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
		 *
		 * Triggers:
		 *   candy:core.chat.connection using {status}
		 */
		Connect: function(status) {
			Candy.Core.setStropheStatus(status);
			switch(status) {
				case Strophe.Status.CONNECTED:
					Candy.Core.log('[Connection] Connected');
					Candy.Core.Action.Jabber.GetJidIfAnonymous();
					/* falls through */
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
			/** Event: candy:core.chat.connection
			 * Connection status updates
			 *
			 * Parameters:
			 *   (Strophe.Status) status - Strophe status
			 */
			$(Candy).triggerHandler('candy:core.chat.connection', { status: status } );
		}
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
		 * Triggers:
		 *   candy:core.presence.update using {from, stanza}
		 *
		 * Returns:
		 *   (Boolean) - true
		 */
		Presence: function(msg) {
			Candy.Core.log('[Jabber] Presence');
			msg = Candy.Util.unescapeAttrJids($(msg));
			if(msg.children('x[xmlns^="' + Strophe.NS.MUC + '"]').length > 0) {
				if (msg.attr('type') === 'error') {
					self.Jabber.Room.PresenceError(msg);
				} else {
					self.Jabber.Room.PresenceDispatcher(msg);
				}
			} else {
				/** Event: candy:core.presence.update
				 * Presence updates. Emitted only when not a muc presence.
				 *
				 * Parameters:
				 *   (JID) from - From Jid
				 *   (String) stanza - Stanza
				 */
				$(Candy).triggerHandler('candy:core.presence.update', {'from': msg.attr('from'), 'stanza': msg});
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
			msg = Candy.Util.unescapeAttrJids($(msg));
			// Autojoin bookmarks (Openfire)
			$('conference', msg).each(function() {
				var item = $(this);
				if(item.attr('autojoin')) {
					Candy.Core.Action.Jabber.Room.Join(Candy.Util.unescapeJid(item.attr('jid')));
				}
			});
			return true;
		},

		/** Function: PrivacyList
		 * Acts on a privacy list event and sets up the current privacy list of this user.
		 *
		 * If no privacy list has been added yet, create the privacy list and listen again to this event.
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
			msg = Candy.Util.unescapeAttrJids($(msg));
			if(msg.attr('type') === 'result') {
				$('list[name="ignore"] item', msg).each(function() {
					var item = $(this);
					if (item.attr('action') === 'deny') {
						currentUser.addToOrRemoveFromPrivacyList('ignore', Candy.Util.unescapeJid(item.attr('value')));
					}
				});
				Candy.Core.Action.Jabber.SetIgnoreListActive();
				return false;
			}
			return self.Jabber.PrivacyListError(msg);
		},

		/** Function: PrivacyListError
		 * Acts when a privacy list error has been received.
		 *
		 * Currently only handles the case, when a privacy list doesn't exist yet and creates one.
		 *
		 * Parameters:
		 *   (String) msg - Raw XML Message
		 *
		 * Returns:
		 *   (Boolean) - false to disable the handler after first call.
		 */
		PrivacyListError: function(msg) {
			Candy.Core.log('[Jabber] PrivacyListError');
			// check if msg says that privacyList doesn't exist
			if ($('error[code="404"][type="cancel"] item-not-found', msg)) {
				Candy.Core.Action.Jabber.ResetIgnoreList();
				Candy.Core.Action.Jabber.SetIgnoreListActive();
			}
			return false;
		},

		/** Function: Message
		 * Acts on room, admin and server messages and notifies the view if required.
		 *
		 * Parameters:
		 *   (String) msg - Raw XML Message
		 *
		 * Triggers:
		 *   candy:core.chat.message.admin using {type, message}
		 *   candy:core.chat.message.server {type, subject, message}
		 *
		 * Returns:
		 *   (Boolean) - true
		 */
		Message: function(msg) {
			Candy.Core.log('[Jabber] Message');
			msg = Candy.Util.unescapeAttrJids($(msg));
			var fromJid = msg.attr('from'),
				type = msg.attr('type'),
				toJid = msg.attr('to');
			// Room message
			if(fromJid !== Strophe.getDomainFromJid(fromJid) && (type === 'groupchat' || type === 'chat' || type === 'error' || type === 'normal')) {
				self.Jabber.Room.Message(msg);
			// Admin message
			} else if(!toJid && fromJid === Strophe.getDomainFromJid(fromJid)) {
				/** Event: candy:core.chat.message.admin
				 * Admin message
				 *
				 * Parameters:
				 *   (String) type - Type of the message [default: message]
				 *   (String) message - Message text
				 */
				$(Candy).triggerHandler('candy:core.chat.message.admin', { type: (type || 'message'), message: msg.children('body').text() });
			// Server Message
			} else if(toJid && fromJid === Strophe.getDomainFromJid(fromJid)) {
				/** Event: candy:core.chat.message.server
				 * Server message (e.g. subject)
				 *
				 * Parameters:
				 *   (String) type - Message type [default: message]
				 *   (String) subject - Subject text
				 *   (String) message - Message text
				 */
				$(Candy).triggerHandler('candy:core.chat.message.server', {
					type: (type || 'message'),
					subject: msg.children('subject').text(),
					message: msg.children('body').text()
				});
			}
			return true;
		},

		/** Class: Candy.Core.Event.Jabber.Room
		 * Room specific events
		 */
		Room: {
			/** Function: Presence
			 * Acts on various presence messages (room leaving, room joining, error presence) and notifies view.
			 *
			 * Parameters:
			 *   (jQuery.Element) $stanza - jQuery object of XML message
			 *
			 * Triggers:
			 *   candy:core.presence.room using {roomJid, roomName, user, action, currentUser}
			 *
			 * Returns:
			 *   (Boolean) - true
			 */
			PresenceDispatcher: function($stanza) {
				Candy.Core.log('[Jabber:Room] Presence');
				var from = $stanza.attr('from'),
					roomJid = Strophe.getBareJidFromJid(from),
					presenceType = $stanza.attr('type'),
					isJoin = presenceType !== 'unavailable',
					isLeave = !isJoin,
					statuses = Candy.Util.parseStatusCodes($stanza),
					isMe = statuses[110] !== undefined,
					isNickChange = statuses[303] !== undefined,
					isNickAssign = statuses[210] !== undefined,
					isKick = statuses[307] !== undefined,
					isBan = statuses[301] !== undefined,
					item = $stanza.find('item'),
					user,
					action;

				// Current User joined a room
				var room = Candy.Core.getRoom(roomJid);
				if(!room) {
					room = new Candy.Core.ChatRoom(roomJid);
					Candy.Core.getRooms()[roomJid] = room;
				}

				var currentUser = room.getUser() ? room.getUser() : Candy.Core.getUser();
				// on kick/ban, presence stanza doesn't contain code '110' even if
				// it's directed to myself - therefore, check for 'from' equality as well.
				isMe = isMe || currentUser.getJid() === from;


				if(isMe && isLeave && !isNickChange) {
					return self.Jabber.Room.LeavePresence({
						from: from,
						roomJid: roomJid,
						isMe: isMe,
						isKick: isKick,
						isBan: isBan,
						item: item,
						room: room
					});
				}

				var roster = room.getRoster(),
					nick;
				user = roster.get(from);

				if(isJoin) {
					action = 'join';
					if (user) {
						self.Jabber.Room.ChangePresence({
							user: user,
							item: item
						});
					} else {
						var args = self.Jabber.Room.JoinPresence({
							from: from,
							item: item,
							currentUser: currentUser,
							room: room,
							isNickAssign: isNickAssign,
							roster: roster
						});
						user = args.user;
						currentUser = args.currentUser;
					}
				// User left a room
				} else {
					if(isNickChange) {
						// user changed nick
						nick = item.attr('nick');
						action = 'nickchange';
						user.setPreviousNick(user.getNick());
						user.setNick(nick);
						user.setJid(Strophe.getBareJidFromJid(from) + '/' + nick);
					} else {
						roster.remove(from);
						if(isKick) {
							action = 'kick';
						} else if(isBan) {
							action = 'ban';
						} else {
							action = 'leave';
						}
					}
				}

				/** Event: candy:core.presence.room
				 * Room presence updates
				 *
				 * Parameters:
				 *   (String) roomJid - Room JID
				 *   (String) roomName - Room name
				 *   (Candy.Core.ChatUser) user - User which does the presence update
				 *   (String) action - Action [kick, ban, leave, join]
				 *   (Candy.Core.ChatUser) currentUser - Current local user
				 */
				$(Candy).triggerHandler('candy:core.presence.room', {
					'roomJid': roomJid,
					'roomName': room.getName(),
					'user': user,
					'action': action,
					'isMe': isMe,
					'currentUser': currentUser
				});
				return true;
			},

			JoinPresence: function(args) {
				var nick = Strophe.getResourceFromJid(args.from);
				var user = new Candy.Core.ChatUser(args.from, nick, args.item.attr('affiliation'), args.item.attr('role'));
				var currentUser = args.currentUser;
				// Room existed but client (myself) is not yet registered
				if(args.room.getUser() === null && (Candy.Core.getUser().getNick() === nick || args.isNickAssign)) {
					args.room.setUser(user);
					currentUser = user;
				}
				args.roster.add(user);
				return {
					user: user,
					currentUser: currentUser
				};
			},

			/** Function: LeavePresence
			 * Presence called when a user leaves a room.
			 *
			 * Parameters:
			 *   (Object) args - Various arguments from the dispatcher
			 */
			LeavePresence: function(args) {
				Candy.Core.log('[Jabber:Room] Leave');

				var roomName = args.room.getName();
				var action = 'leave';
				var reason, actor;

				delete Candy.Core.getRooms()[args.roomJid];
				// if user gets kicked, role is none and there's a status code 307
				if(args.isKick || args.isBan) {
					reason = args.item.find('reason').text();
					actor  = args.item.find('actor').attr('jid');
				}

				// FIXME: why?
				var user = new Candy.Core.ChatUser(args.from,
								Strophe.getResourceFromJid(args.from),
								args.item.attr('affiliation'),
								args.item.attr('role'));

				/** Event: candy:core.presence.leave
				 * When the local client leaves a room
				 *
				 * Also triggered when the local client gets kicked or banned from a room.
				 *
				 * Parameters:
				 *   (String) roomJid - Room
				 *   (String) roomName - Name of room
				 *   (String) action - Presence type [kick, ban, leave]
				 *   (String) reason - When action equals kick|ban, this is the reason the moderator has supplied.
				 *   (String) actor - When action equals kick|ban, this is the moderator which did the kick
				 *   (Candy.Core.ChatUser) user - user which leaves the room
				 */
				$(Candy).triggerHandler('candy:core.presence.leave', {
					'roomJid': args.roomJid,
					'roomName': roomName,
					'action': action,
					'reason': reason,
					'isMe': args.isMe,
					'actor': actor,
					'user': user
				});
				return true;
			},

			KickPresence: function(/*args*/) {

			},

			BanPresence: function(/*args*/) {

			},

			ChangePresence: function(args) {
				var role = args.item.attr('role'),
					affiliation = args.item.attr('affiliation');

				args.user.setRole(role);
				args.user.setAffiliation(affiliation);
			},

			/** Function: PresenceError
			 * Acts when a presence of type error has been retrieved.
			 *
			 * Parameters:
			 *   (Object) $stanza - jQuery object of XML message
			 *
			 * Triggers:
			 *   candy:core.presence.error using {$stanza, type, roomJid, roomName}
			 *
			 * Returns:
			 *   (Boolean) - true
			 */
			PresenceError: function($stanza) {
				Candy.Core.log('[Jabber:Room] Presence Error');
				var from = $stanza.attr('from'),
					roomJid = Strophe.getBareJidFromJid(from),
					room = Candy.Core.getRooms()[roomJid],
					roomName = room.getName();

				// Presence error: Remove room from array to prevent error when disconnecting
				Candy.Core.removeRoom(roomJid);
				room = undefined;

				/** Event: candy:core.presence.error
				 * Triggered when a presence error happened
				 *
				 * Parameters:
				 *   (Object) $stanza - jQuery object of XML message
				 *   (String) type - Error type
				 *   (String) roomJid - Room jid
				 *   (String) roomName - Room name
				 */
				$(Candy).triggerHandler('candy:core.presence.error', {
					'stanza' : $stanza,
					'type': $stanza.children('error').children()[0].tagName.toLowerCase(),
					'roomJid': roomJid,
					'roomName': roomName
				});
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
				msg = Candy.Util.unescapeAttrJids($(msg));
				// Temp fix for #219
				// Don't go further if it's no conference disco reply
				// FIXME: Do this in a more beautiful way
				if(!msg.find('identity[category="conference"]').length) {
					return true;
				}

				var roomJid = Strophe.getBareJidFromJid(msg.attr('from'));
				// Client joined a room
				if(!Candy.Core.getRooms()[roomJid]) {
					Candy.Core.getRooms()[roomJid] = new Candy.Core.ChatRoom(roomJid);
				}
				// Room existed but room name was unknown
				var identity = msg.find('identity');
				if(identity.length) {
					var roomName = identity.attr('name'),
						room = Candy.Core.getRoom(roomJid);
					if(room.getName() === null) {
						room.setName(Strophe.unescapeNode(roomName));
					// Room name changed
					}/*else if(room.getName() !== roomName && room.getUser() !== null) {
						// NOTE: We want to notify the View here but jabber doesn't send anything when the room name changes :-(
					}*/
				}
				return true;
			},

			/** Function: Message
			 * Acts on various message events (subject changed, private chat message, multi-user chat message)
			 * and notifies view.
			 *
			 * Parameters:
			 *   (String) msg - jQuery object of XML message
			 *
			 * Triggers:
			 *   candy:core.message using {roomJid, message, timestamp}
			 *
			 * Returns:
			 *   (Boolean) - true
			 */
			Message: function(msg) {
				Candy.Core.log('[Jabber:Room] Message');
				// Room subject
				var roomJid, message;
				if(msg.children('subject').length > 0) {
					roomJid = Strophe.getBareJidFromJid(msg.attr('from'));
					message = { name: Strophe.getNodeFromJid(roomJid), body: msg.children('subject').text(), type: 'subject' };
				// Error messsage
				} else if(msg.attr('type') === 'error') {
					var error = msg.children('error');
					if(error.children('text').length > 0) {
						roomJid = msg.attr('from');
						message = { type: 'info', body: error.children('text').text() };
					}
				// Chat message
				} else if(msg.children('body').length > 0) {
					// Private chat message
					if(msg.attr('type') === 'chat' || msg.attr('type') === 'normal') {
						roomJid = msg.attr('from');
						var bareRoomJid = Strophe.getBareJidFromJid(roomJid),
							// if a 3rd-party client sends a direct message to this user (not via the room) then the username is the node and not the resource.
							isNoConferenceRoomJid = !Candy.Core.getRoom(bareRoomJid),
							name = isNoConferenceRoomJid ? Strophe.getNodeFromJid(roomJid) : Strophe.getResourceFromJid(roomJid);
						message = { name: name, body: msg.children('body').text(), type: msg.attr('type'), isNoConferenceRoomJid: isNoConferenceRoomJid };
					// Multi-user chat message
					} else {
						roomJid = Strophe.getBareJidFromJid(msg.attr('from'));
						var resource = Strophe.getResourceFromJid(msg.attr('from'));
						// Message from a user
						if(resource) {
							resource = Strophe.unescapeNode(resource);
							message = { name: resource, body: msg.children('body').text(), type: msg.attr('type') };
						// Message from server (XEP-0045#registrar-statuscodes)
						} else {
							// we are not yet present in the room, let's just drop this message (issue #105)
							if(!Candy.View.Pane.Chat.rooms[msg.attr('from')]) {
								return true;
							}
							message = { name: '', body: msg.children('body').text(), type: 'info' };
						}
					}
				// Unhandled message
				} else {
					return true;
				}

				// besides the delayed delivery (XEP-0203), there exists also XEP-0091 which is the legacy delayed delivery.
				// the x[xmlns=jabber:x:delay] is the format in XEP-0091.
				var delay = msg.children('delay') ? msg.children('delay') : msg.children('x[xmlns="' + Strophe.NS.DELAY +'"]'),
					timestamp = delay !== undefined ? delay.attr('stamp') : null;

				/** Event: candy:core.message
				 * Triggers on various message events (subject changed, private chat message, multi-user chat message).
				 *
				 * The resulting message object can contain different key-value pairs as stated in the documentation
				 * of the parameters itself.
				 *
				 * The following lists explain those parameters:
				 *
				 * Message Object Parameters:
				 *   (String) name - Room name
				 *   (String) body - Message text
				 *   (String) type - Message type ([normal, chat, groupchat])
				 *                   or 'info' which is used internally for displaying informational messages
				 *   (Boolean) isNoConferenceRoomJid - if a 3rd-party client sends a direct message to
				 *                                     this user (not via the room) then the username is the node
				 *                                     and not the resource.
				 *                                     This flag tells if this is the case.
				 *
				 * Parameters:
				 *   (String) roomJid - Room jid
				 *   (Object) message - Depending on what kind of message, the object consists of different key-value pairs:
				 *                        - Room Subject: {name, body, type}
				 *                        - Error message: {type = 'info', body}
				 *                        - Private chat message: {name, body, type, isNoConferenceRoomJid}
				 *                        - MUC msg from a user: {name, body, type}
				 *                        - MUC msg from server: {name = '', body, type = 'info'}
				 *   (String) timestamp - Timestamp, only when it's an offline message
				 *
				 * TODO:
				 *   Streamline those events sent and rename the parameters.
				 */
				$(Candy).triggerHandler('candy:core.message', {
					roomJid: roomJid,
					message: message,
					timestamp: timestamp
				});
				return true;
			}
		}
	};

	return self;
}(Candy.Core.Event || {}, Strophe, jQuery));
