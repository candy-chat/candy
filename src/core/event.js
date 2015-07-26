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
 *   (c) 2015 Adhearsion Foundation Inc <info@adhearsion.com>. All rights reserved.
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
					$(Candy).on('candy:core:roster:fetched', function () {
						Candy.Core.Action.Jabber.Presence();
					});
					Candy.Core.Action.Jabber.Roster();
					Candy.Core.Action.Jabber.EnableCarbons();
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
					Candy.Core.warn('[Connection] Unknown status received:', status);
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
		 *   candy:core.presence using {from, stanza}
		 *
		 * Returns:
		 *   (Boolean) - true
		 */
		Presence: function(msg) {
			Candy.Core.log('[Jabber] Presence');
			msg = $(msg);
			if(msg.children('x[xmlns^="' + Strophe.NS.MUC + '"]').length > 0) {
				if (msg.attr('type') === 'error') {
					self.Jabber.Room.PresenceError(msg);
				} else {
					self.Jabber.Room.Presence(msg);
				}
			} else {
				/** Event: candy:core.presence
				 * Presence updates. Emitted only when not a muc presence.
				 *
				 * Parameters:
				 *   (JID) from - From Jid
				 *   (String) stanza - Stanza
				 */
				$(Candy).triggerHandler('candy:core.presence', {'from': msg.attr('from'), 'stanza': msg});
			}
			return true;
		},

		/** Function: RosterLoad
		 * Acts on the result of loading roster items from a cache
		 *
		 * Parameters:
		 *   (String) items - List of roster items
		 *
 		 * Triggers:
		 *   candy:core.roster.loaded
		 *
		 * Returns:
		 *   (Boolean) - true
		 */
		RosterLoad: function(items) {
			self.Jabber._addRosterItems(items);

			/** Event: candy:core.roster.loaded
			 * Notification of the roster having been loaded from cache
			 */
			$(Candy).triggerHandler('candy:core:roster:loaded', {roster: Candy.Core.getRoster()});

			return true;
		},

		/** Function: RosterFetch
		 * Acts on the result of a roster fetch
		 *
		 * Parameters:
		 *   (String) items - List of roster items
		 *
 		 * Triggers:
		 *   candy:core.roster.fetched
		 *
		 * Returns:
		 *   (Boolean) - true
		 */
		RosterFetch: function(items) {
			self.Jabber._addRosterItems(items);

			/** Event: candy:core.roster.fetched
			 * Notification of the roster having been fetched
			 */
			$(Candy).triggerHandler('candy:core:roster:fetched', {roster: Candy.Core.getRoster()});

			return true;
		},

		/** Function: RosterPush
		 * Acts on a roster push
		 *
		 * Parameters:
		 *   (String) stanza - Raw XML Message
		 *
 		 * Triggers:
		 *   candy:core.roster.added
		 *   candy:core.roster.updated
		 *   candy:core.roster.removed
		 *
		 * Returns:
		 *   (Boolean) - true
		 */
		RosterPush: function(items, updatedItem) {
			if (!updatedItem) {
				return true;
			}

			if (updatedItem.subscription === "remove") {
				var contact = Candy.Core.getRoster().get(updatedItem.jid);
				Candy.Core.getRoster().remove(updatedItem.jid);
				/** Event: candy:core.roster.removed
				 * Notification of a roster entry having been removed
 				 *
				 * Parameters:
				 *   (Candy.Core.Contact) contact - The contact that was removed from the roster
				 */
				$(Candy).triggerHandler('candy:core:roster:removed', {contact: contact});
			} else {
				var user = Candy.Core.getRoster().get(updatedItem.jid);
				if (!user) {
					user = self.Jabber._addRosterItem(updatedItem);
					/** Event: candy:core.roster.added
					 * Notification of a roster entry having been added
	 				 *
					 * Parameters:
					 *   (Candy.Core.Contact) contact - The contact that was added
					 */
					$(Candy).triggerHandler('candy:core:roster:added', {contact: user});
				} else {
					/** Event: candy:core.roster.updated
					 * Notification of a roster entry having been updated
	 				 *
					 * Parameters:
					 *   (Candy.Core.Contact) contact - The contact that was updated
					 */
					$(Candy).triggerHandler('candy:core:roster:updated', {contact: user});
				}
			}

			return true;
		},

		_addRosterItem: function(item) {
			var user = new Candy.Core.Contact(item);
			Candy.Core.getRoster().add(user);
			return user;
		},

		_addRosterItems: function(items) {
			$.each(items, function(i, item) {
				self.Jabber._addRosterItem(item);
			});
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
			// Autojoin bookmarks
			$('conference', msg).each(function() {
				var item = $(this);
				if(item.attr('autojoin')) {
					Candy.Core.Action.Jabber.Room.Join(item.attr('jid'));
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
			msg = $(msg);
			if(msg.attr('type') === 'result') {
				$('list[name="ignore"] item', msg).each(function() {
					var item = $(this);
					if (item.attr('action') === 'deny') {
						currentUser.addToOrRemoveFromPrivacyList('ignore', item.attr('value'));
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
			msg = $(msg);

			var type = msg.attr('type') || 'normal';

			switch (type) {
				case 'normal':
					var invite = self.Jabber._findInvite(msg);

					if (invite) {
						/** Event: candy:core:chat:invite
						 * Incoming chat invite for a MUC.
						 *
						 * Parameters:
						 *   (String) roomJid - The room the invite is to
						 *   (String) from - User JID that invite is from text
						 *   (String) reason - Reason for invite
						 *   (String) password - Password for the room
						 *   (String) continuedThread - The thread ID if this is a continuation of a 1-on-1 chat
						 */
						$(Candy).triggerHandler('candy:core:chat:invite', invite);
					}

					/** Event: candy:core:chat:message:normal
					 * Messages with the type attribute of normal or those
					 * that do not have the optional type attribute.
					 *
					 * Parameters:
					 *   (String) type - Type of the message
					 *   (Object) message - Message object.
					 */
					$(Candy).triggerHandler('candy:core:chat:message:normal', {
						type: type,
						message: msg
					});
					break;
				case 'headline':
					// Admin message
					if(!msg.attr('to')) {
						/** Event: candy:core.chat.message.admin
						 * Admin message
						 *
						 * Parameters:
						 *   (String) type - Type of the message
						 *   (String) message - Message text
						 */
						$(Candy).triggerHandler('candy:core.chat.message.admin', {
							type: type,
							message: msg.children('body').text()
						});
					// Server Message
					} else {
						/** Event: candy:core.chat.message.server
						 * Server message (e.g. subject)
						 *
						 * Parameters:
						 *   (String) type - Message type
						 *   (String) subject - Subject text
						 *   (String) message - Message text
						 */
						$(Candy).triggerHandler('candy:core.chat.message.server', {
							type: type,
							subject: msg.children('subject').text(),
							message: msg.children('body').text()
						});
					}
					break;
				case 'groupchat':
				case 'chat':
				case 'error':
					// Room message
					self.Jabber.Room.Message(msg);
					break;
				default:
					/** Event: candy:core:chat:message:other
					 * Messages with a type other than the ones listed in RFC3921
					 * section 2.1.1. This allows plugins to catch custom message
					 * types.
					 *
					 * Parameters:
					 *   (String) type - Type of the message [default: message]
					 *   (Object) message - Message object.
					 */
					// Detect message with type normal or with no type.
					$(Candy).triggerHandler('candy:core:chat:message:other', {
						type: type,
						message: msg
					});
			}

			return true;
		},

		_findInvite: function (msg) {
			var mediatedInvite = msg.find('invite'),
				directInvite = msg.find('x[xmlns="jabber:x:conference"]'),
				invite;

			if(mediatedInvite.length > 0) {
				var passwordNode = msg.find('password'),
					password,
					reasonNode = mediatedInvite.find('reason'),
					reason,
					continueNode = mediatedInvite.find('continue');

				if(passwordNode.text() !== '') {
					password = passwordNode.text();
				}

				if(reasonNode.text() !== '') {
					reason = reasonNode.text();
				}

				invite = {
					roomJid: msg.attr('from'),
					from: mediatedInvite.attr('from'),
					reason: reason,
					password: password,
					continuedThread: continueNode.attr('thread')
				};
			}

			if(directInvite.length > 0) {
				invite = {
					roomJid: directInvite.attr('jid'),
					from: msg.attr('from'),
					reason: directInvite.attr('reason'),
					password: directInvite.attr('password'),
					continuedThread: directInvite.attr('thread')
				};
			}

			return invite;
		},

		/** Class: Candy.Core.Event.Jabber.Room
		 * Room specific events
		 */
		Room: {
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
				msg = $(msg);
				// Temp fix for #219
				// Don't go further if it's no conference disco reply
				// FIXME: Do this in a more beautiful way
				if(!msg.find('identity[category="conference"]').length) {
					return true;
				}
				var roomJid = Strophe.getBareJidFromJid(Candy.Util.unescapeJid(msg.attr('from')));

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

			/** Function: Presence
			 * Acts on various presence messages (room leaving, room joining, error presence) and notifies view.
			 *
			 * Parameters:
			 *   (Object) msg - jQuery object of XML message
			 *
			 * Triggers:
			 *   candy:core.presence.room using {roomJid, roomName, user, action, currentUser}
			 *
			 * Returns:
			 *   (Boolean) - true
			 */
			Presence: function(msg) {
				Candy.Core.log('[Jabber:Room] Presence');
				var from = Candy.Util.unescapeJid(msg.attr('from')),
					roomJid = Strophe.getBareJidFromJid(from),
					presenceType = msg.attr('type'),
					isNewRoom = self.Jabber.Room._msgHasStatusCode(msg, 201),
					nickAssign = self.Jabber.Room._msgHasStatusCode(msg, 210),
					nickChange = self.Jabber.Room._msgHasStatusCode(msg, 303);

				// Current User joined a room
				var room = Candy.Core.getRoom(roomJid);
				if(!room) {
					Candy.Core.getRooms()[roomJid] = new Candy.Core.ChatRoom(roomJid);
					room = Candy.Core.getRoom(roomJid);
				}

				var roster = room.getRoster(),
					currentUser = room.getUser() ? room.getUser() : Candy.Core.getUser(),
					action, user,
					nick,
					show = msg.find('show'),
					item = msg.find('item');
				// User joined a room
				if(presenceType !== 'unavailable') {
					if (roster.get(from)) {
						// role/affiliation change
						user = roster.get(from);

						var role = item.attr('role'),
							affiliation = item.attr('affiliation');

						user.setRole(role);
						user.setAffiliation(affiliation);

						user.setStatus("available");

						// FIXME: currently role/affilation changes are handled with this action
						action = 'join';
					} else {
						nick = Strophe.getResourceFromJid(from);
						user = new Candy.Core.ChatUser(from, nick, item.attr('affiliation'), item.attr('role'), item.attr('jid'));
						// Room existed but client (myself) is not yet registered
						if(room.getUser() === null && (Candy.Core.getUser().getNick() === nick || nickAssign)) {
							room.setUser(user);
							currentUser = user;
						}
						user.setStatus('available');
						roster.add(user);
						action = 'join';
					}

					if (show.length > 0) {
						user.setStatus(show.text());
					}
				// User left a room
				} else {
					user = roster.get(from);
					roster.remove(from);

					if(nickChange) {
						// user changed nick
						nick = item.attr('nick');
						action = 'nickchange';
						user.setPreviousNick(user.getNick());
						user.setNick(nick);
						user.setJid(Strophe.getBareJidFromJid(from) + '/' + nick);
						roster.add(user);
					} else {
						action = 'leave';
						if(item.attr('role') === 'none') {
							if(self.Jabber.Room._msgHasStatusCode(msg, 307)) {
								action = 'kick';
							} else if(self.Jabber.Room._msgHasStatusCode(msg, 301)) {
								action = 'ban';
							}
						}

						if (Strophe.getResourceFromJid(from) === currentUser.getNick()) {
							// Current User left a room
							self.Jabber.Room._selfLeave(msg, from, roomJid, room.getName(), action);
							return true;
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
				 *   (Boolean) isNewRoom - Whether the room is new (has just been created)
				 */
				$(Candy).triggerHandler('candy:core.presence.room', {
					'roomJid': roomJid,
					'roomName': room.getName(),
					'user': user,
					'action': action,
					'currentUser': currentUser,
					'isNewRoom': isNewRoom
				});
				return true;
			},

			_msgHasStatusCode: function (msg, code) {
				return msg.find('status[code="' + code + '"]').length > 0;
			},

			_selfLeave: function(msg, from, roomJid, roomName, action) {
				Candy.Core.log('[Jabber:Room] Leave');

				Candy.Core.removeRoom(roomJid);

				var item = msg.find('item'),
					reason,
					actor;

				if(action === 'kick' || action === 'ban') {
					reason = item.find('reason').text();
					actor  = item.find('actor').attr('jid');
				}

				var user = new Candy.Core.ChatUser(from, Strophe.getResourceFromJid(from), item.attr('affiliation'), item.attr('role'));

				/** Event: candy:core.presence.leave
				 * When the local client leaves a room
				 *
				 * Also triggered when the local client gets kicked or banned from a room.
				 *
				 * Parameters:
				 *   (String) roomJid - Room
				 *   (String) roomName - Name of room
				 *   (String) type - Presence type [kick, ban, leave]
				 *   (String) reason - When type equals kick|ban, this is the reason the moderator has supplied.
				 *   (String) actor - When type equals kick|ban, this is the moderator which did the kick
				 *   (Candy.Core.ChatUser) user - user which leaves the room
				 */
				$(Candy).triggerHandler('candy:core.presence.leave', {
					'roomJid': roomJid,
					'roomName': roomName,
					'type': action,
					'reason': reason,
					'actor': actor,
					'user': user
				});
			},

			/** Function: PresenceError
			 * Acts when a presence of type error has been retrieved.
			 *
			 * Parameters:
			 *   (Object) msg - jQuery object of XML message
			 *
			 * Triggers:
			 *   candy:core.presence.error using {msg, type, roomJid, roomName}
			 *
			 * Returns:
			 *   (Boolean) - true
			 */
			PresenceError: function(msg) {
				Candy.Core.log('[Jabber:Room] Presence Error');
				var from = Candy.Util.unescapeJid(msg.attr('from')),
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
				 *   (Object) msg - jQuery object of XML message
				 *   (String) type - Error type
				 *   (String) roomJid - Room jid
				 *   (String) roomName - Room name
				 */
				$(Candy).triggerHandler('candy:core.presence.error', {
					'msg' : msg,
					'type': msg.children('error').children()[0].tagName.toLowerCase(),
					'roomJid': roomJid,
					'roomName': roomName
				});
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

				var carbon = false,
					partnerJid = Candy.Util.unescapeJid(msg.attr('from'));

				if (msg.children('sent[xmlns="' + Strophe.NS.CARBONS + '"]').length > 0) {
					carbon = true;
					msg = $(msg.children('sent').children('forwarded').children('message'));
					partnerJid = Candy.Util.unescapeJid(msg.attr('to'));
				}

				if (msg.children('received[xmlns="' + Strophe.NS.CARBONS + '"]').length > 0) {
					carbon = true;
					msg = $(msg.children('received').children('forwarded').children('message'));
					partnerJid = Candy.Util.unescapeJid(msg.attr('from'));
				}

				// Room subject
				var roomJid, roomName, from, message, name, room, sender;
				if(msg.children('subject').length > 0 && msg.children('subject').text().length > 0 && msg.attr('type') === 'groupchat') {
					roomJid = Candy.Util.unescapeJid(Strophe.getBareJidFromJid(partnerJid));
					from = Candy.Util.unescapeJid(Strophe.getBareJidFromJid(msg.attr('from')));
					roomName = Strophe.getNodeFromJid(roomJid);
					message = { from: from, name: Strophe.getNodeFromJid(from), body: msg.children('subject').text(), type: 'subject' };
				// Error messsage
				} else if(msg.attr('type') === 'error') {
					var error = msg.children('error');
					if(error.children('text').length > 0) {
						roomJid = partnerJid;
						roomName = Strophe.getNodeFromJid(roomJid);
						message = { from: msg.attr('from'), type: 'info', body: error.children('text').text() };
					}
				// Chat message
				} else if(msg.children('body').length > 0) {
					// Private chat message
					if(msg.attr('type') === 'chat' || msg.attr('type') === 'normal') {
						from = Candy.Util.unescapeJid(msg.attr('from'));
						var barePartner = Strophe.getBareJidFromJid(partnerJid),
							bareFrom = Strophe.getBareJidFromJid(from),
							isNoConferenceRoomJid = !Candy.Core.getRoom(barePartner);

						if (isNoConferenceRoomJid) {
							roomJid = barePartner;

							var partner = Candy.Core.getRoster().get(barePartner);
							if (partner) {
								roomName = partner.getName();
							} else {
								roomName = Strophe.getNodeFromJid(barePartner);
							}

							if (bareFrom === Candy.Core.getUser().getJid()) {
								sender = Candy.Core.getUser();
							} else {
								sender = Candy.Core.getRoster().get(bareFrom);
							}
							if (sender) {
								name = sender.getName();
							} else {
								name = Strophe.getNodeFromJid(from);
							}
						} else {
							roomJid = partnerJid;
							room = Candy.Core.getRoom(Candy.Util.unescapeJid(Strophe.getBareJidFromJid(from)));
							sender = room.getRoster().get(from);
							if (sender) {
								name = sender.getName();
							} else {
								name = Strophe.getResourceFromJid(from);
							}
							roomName = name;
						}
						message = { from: from, name: name, body: msg.children('body').text(), type: msg.attr('type'), isNoConferenceRoomJid: isNoConferenceRoomJid };
					// Multi-user chat message
					} else {
						from = Candy.Util.unescapeJid(msg.attr('from'));
						roomJid = Candy.Util.unescapeJid(Strophe.getBareJidFromJid(partnerJid));
						var resource = Strophe.getResourceFromJid(partnerJid);
						// Message from a user
						if(resource) {
							room = Candy.Core.getRoom(roomJid);
							roomName = room.getName();
							if (resource === Candy.Core.getUser().getNick()) {
								sender = Candy.Core.getUser();
							} else {
								sender = room.getRoster().get(from);
							}
							if (sender) {
								name = sender.getName();
							} else {
								name = Strophe.unescapeNode(resource);
							}
							message = { from: roomJid, name: name, body: msg.children('body').text(), type: msg.attr('type') };
						// Message from server (XEP-0045#registrar-statuscodes)
						} else {
							// we are not yet present in the room, let's just drop this message (issue #105)
							if(!Candy.Core.getRooms()[partnerJid]) {
								return true;
							}
							roomName = '';
							message = { from: roomJid, name: '', body: msg.children('body').text(), type: 'info' };
						}
					}

					var xhtmlChild = msg.children('html[xmlns="' + Strophe.NS.XHTML_IM + '"]');
					if(xhtmlChild.length > 0) {
						var xhtmlMessage = $($('<div>').append(xhtmlChild.children('body').first().contents()).html());
						message.xhtmlMessage = xhtmlMessage;
					}

					self.Jabber.Room._checkForChatStateNotification(msg, roomJid, name);
				// Unhandled message
				} else {
					return true;
				}

				// besides the delayed delivery (XEP-0203), there exists also XEP-0091 which is the legacy delayed delivery.
				// the x[xmlns=jabber:x:delay] is the format in XEP-0091.
				var delay = msg.children('delay[xmlns="' + Strophe.NS.DELAY +'"]');

				message.delay = false; // Default delay to being false.

				if (delay.length < 1) {
					// The jQuery xpath implementation doesn't support the or operator
					delay = msg.children('x[xmlns="' + Strophe.NS.JABBER_DELAY +'"]');
				} else {
					// Add delay to the message object so that we can more easily tell if it's a delayed message or not.
					message.delay = true;
				}

				var timestamp = delay.length > 0 ? delay.attr('stamp') : (new Date()).toISOString();

				/** Event: candy:core.message
				 * Triggers on various message events (subject changed, private chat message, multi-user chat message).
				 *
				 * The resulting message object can contain different key-value pairs as stated in the documentation
				 * of the parameters itself.
				 *
				 * The following lists explain those parameters:
				 *
				 * Message Object Parameters:
				 *   (String) from - The unmodified JID that the stanza came from
				 *   (String) name - Sender name
				 *   (String) body - Message text
				 *   (String) type - Message type ([normal, chat, groupchat])
				 *                   or 'info' which is used internally for displaying informational messages
				 *   (Boolean) isNoConferenceRoomJid - if a 3rd-party client sends a direct message to
				 *                                     this user (not via the room) then the username is the node
				 *                                     and not the resource.
				 *                                     This flag tells if this is the case.
				 *   (Boolean) delay - If there is a value for the delay element on a message it is a delayed message.
				 *										 This flag tells if this is the case.
				 *
				 * Parameters:
				 *   (String) roomJid - Room jid. For one-on-one messages, this is sanitized to the bare JID for indexing purposes.
				 *   (String) roomName - Name of the contact
				 *   (Object) message - Depending on what kind of message, the object consists of different key-value pairs:
				 *                        - Room Subject: {name, body, type}
				 *                        - Error message: {type = 'info', body}
				 *                        - Private chat message: {name, body, type, isNoConferenceRoomJid}
				 *                        - MUC msg from a user: {name, body, type}
				 *                        - MUC msg from server: {name = '', body, type = 'info'}
				 *   (String) timestamp - Timestamp, only when it's an offline message
				 *   (Boolean) carbon - Indication of wether or not the message was a carbon
				 *   (String) stanza - The raw XML stanza
				 *
				 * TODO:
				 *   Streamline those events sent and rename the parameters.
				 */
				$(Candy).triggerHandler('candy:core.message', {
					roomJid: roomJid,
					roomName: roomName,
					message: message,
					timestamp: timestamp,
					carbon: carbon,
					stanza: msg
				});
				return true;
			},

			_checkForChatStateNotification: function (msg, roomJid, name) {
				var chatStateElements = msg.children('*[xmlns="http://jabber.org/protocol/chatstates"]');
				if (chatStateElements.length > 0) {
					/** Event: candy:core:message:chatstate
					 * Triggers on any recieved chatstate notification.
					 *
					 * The resulting message object contains the name of the person, the roomJid, and the indicated chatstate.
					 *
					 * The following lists explain those parameters:
					 *
					 * Message Object Parameters:
					 *   (String) name - User name
					 *   (String) roomJid - Room jid
					 *   (String) chatstate - Chatstate being indicated. ("active", "composing", "paused", "inactive", "gone")
					 *
					 */
					$(Candy).triggerHandler('candy:core:message:chatstate', {
						name: name,
						roomJid: roomJid,
						chatstate: chatStateElements[0].tagName
					});
				}
			}
		}
	};

	return self;
}(Candy.Core.Event || {}, Strophe, jQuery));
