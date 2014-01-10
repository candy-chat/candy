/** File: action.js
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

/* global Candy, $iq, navigator, Candy, $pres, Strophe, jQuery */

/** Class: Candy.Core.Action
 * Chat Actions (basicly a abstraction of Jabber commands)
 *
 * Parameters:
 *   (Candy.Core.Action) self - itself
 *   (Strophe) Strophe - Strophe
 *   (jQuery) $ - jQuery
 */
Candy.Core.Action = (function(self, Strophe, $) {
	/** Class: Candy.Core.Action.Jabber
	 * Jabber actions
	 */
	self.Jabber = {
		/** Function: Version
		 * Replies to a version request
		 *
		 * Parameters:
		 *   (jQuery.element) msg - jQuery element
		 */
		Version: function(msg) {
			Candy.Core.getConnection().send($iq({
				type: 'result',
				to: Candy.Util.escapeJid(msg.attr('from')),
				from: Candy.Util.escapeJid(msg.attr('to')),
				id: msg.attr('id')
			}).c('query', {
				name: Candy.about.name,
				version: Candy.about.version,
				os: navigator.userAgent
			}));
		},

		/** Function: SetNickname
		 * Sets the supplied nickname for all rooms (if parameter "room" is not specified) or
		 * sets it only for the specified rooms
		 *
		 * Parameters:
		 *   (String) nickname - New nickname
		 *   (Array) rooms - Rooms
		 */
		SetNickname: function(nickname, rooms) {
			rooms = rooms instanceof Array ? rooms : Candy.Core.getRooms();
			var roomNick, presence;
			$.each(rooms, function(roomJid) {
				roomNick = Candy.Util.escapeJid(roomJid + '/' + nickname);
				presence = $pres({
					to: roomNick,
					from: Candy.Core.getConnection().jid,
					id: 'pres:' + Candy.Core.getConnection().getUniqueId()
				});
				Candy.Core.getConnection().send(presence);
			});
		},

		/** Function: Roster
		 * Sends a request for a roster
		 */
		Roster: function() {
			Candy.Core.getConnection().send($iq({type: 'get', xmlns: Strophe.NS.CLIENT}).c('query', {xmlns: Strophe.NS.ROSTER}).tree());
		},

		/** Function: Presence
		 * Sends a request for presence
		 *
		 * Parameters:
		 *   (Object) attr - Optional attributes
		 *   (Strophe.Builder) el - Optional element to include in presence stanza
		 */
		Presence: function(attr, el) {
			var pres = $pres(attr).c('priority').t(Candy.Core.getOptions().presencePriority.toString())
				.up().c('c', Candy.Core.getConnection().caps.generateCapsAttrs())
				.up();
			if(el) {
				pres.node.appendChild(el.node);
			}
			Candy.Core.getConnection().send(pres.tree());
		},

		/** Function: Services
		 * Sends a request for disco items
		 */
		Services: function() {
			Candy.Core.getConnection().send($iq({type: 'get', xmlns: Strophe.NS.CLIENT}).c('query', {xmlns: Strophe.NS.DISCO_ITEMS}).tree());
		},

		/** Function: Autojoin
		 * When Candy.Core.getOptions().autojoin is true, request autojoin bookmarks (OpenFire)
		 *
		 * Otherwise, if Candy.Core.getOptions().autojoin is an array, join each channel specified.
		 * Channel can be in jid:password format to pass room password if needed.

		 * Triggers:
		 *   candy:core.autojoin-missing in case no autojoin info has been found
		 */
		Autojoin: function() {
			// Request bookmarks
			if(Candy.Core.getOptions().autojoin === true) {
				Candy.Core.getConnection().sendIQ($iq({
					type: 'get',
					xmlns: Strophe.NS.CLIENT
				})
				.c('query', {xmlns: Strophe.NS.PRIVATE})
				.c('storage', {xmlns: Strophe.NS.BOOKMARKS})
				.tree());
			// Join defined rooms
			} else if($.isArray(Candy.Core.getOptions().autojoin)) {
				$.each(Candy.Core.getOptions().autojoin, function() {
					self.Jabber.Room.Join.apply(null, this.valueOf().split(':',2));
				});
			} else {
				/** Event: candy:core.autojoin-missing
				 * Triggered when no autojoin information has been found
				 */
				$(Candy).triggerHandler('candy:core.autojoin-missing');
			}
		},

		/** Function: ResetIgnoreList
		 * Create new ignore privacy list (and reset the previous one, if it exists).
		 */
		ResetIgnoreList: function() {
			Candy.Core.getConnection().sendIQ($iq({
					type: 'set',
					from: Candy.Core.getUser().getEscapedJid()
				})
				.c('query', {xmlns: Strophe.NS.PRIVACY })
				.c('list', {name: 'ignore'})
				.c('item', {'action': 'allow', 'order': '0'})
				.tree());
		},

		/** Function: RemoveIgnoreList
		 * Remove an existing ignore list.
		 */
		RemoveIgnoreList: function() {
			Candy.Core.getConnection().sendIQ($iq({
					type: 'set',
					from: Candy.Core.getUser().getEscapedJid()
				})
				.c('query', {xmlns: Strophe.NS.PRIVACY })
				.c('list', {name: 'ignore'}).tree());
		},

		/** Function: GetIgnoreList
		 * Get existing ignore privacy list when connecting.
		 */
		GetIgnoreList: function() {
			var iq = $iq({
					type: 'get',
					from: Candy.Core.getUser().getEscapedJid()
				})
				.c('query', {xmlns: Strophe.NS.PRIVACY})
				.c('list', {name: 'ignore'}).tree();
			var iqId = Candy.Core.getConnection().sendIQ(iq);
			// add handler (<#200 at https://github.com/candy-chat/candy/issues/200>)
			Candy.Core.addHandler(Candy.Core.Event.Jabber.PrivacyList, null, 'iq', null, iqId);
		},

		/** Function: SetIgnoreListActive
		 * Set ignore privacy list active
		 */
		SetIgnoreListActive: function() {
			Candy.Core.getConnection().sendIQ($iq({
					type: 'set',
					from: Candy.Core.getUser().getEscapedJid()})
				.c('query', {xmlns: Strophe.NS.PRIVACY })
				.c('active', {name:'ignore'}).tree());
		},

		/** Function: GetJidIfAnonymous
		 * On anonymous login, initially we don't know the jid and as a result, Candy.Core._user doesn't have a jid.
		 * Check if user doesn't have a jid and get it if necessary from the connection.
		 */
		GetJidIfAnonymous: function() {
			if (!Candy.Core.getUser().getJid()) {
				Candy.Core.log("[Jabber] Anonymous login");
				Candy.Core.getUser().data.jid = Candy.Core.getConnection().jid;
			}
		},

		/** Class: Candy.Core.Action.Jabber.Room
		 * Room-specific commands
		 */
		Room: {
			/** Function: Join
			 * Requests disco of specified room and joins afterwards.
			 *
			 * TODO:
			 *   maybe we should wait for disco and later join the room?
			 *   but what if we send disco but don't want/can join the room
			 *
			 * Parameters:
			 *   (String) roomJid - Room to join
			 *   (String) password - [optional] Password for the room
			 */
			Join: function(roomJid, password) {
				self.Jabber.Room.Disco(roomJid);
				roomJid = Candy.Util.escapeJid(roomJid);
				var conn = Candy.Core.getConnection(),
					roomNick = roomJid + '/' + Candy.Core.getUser().getNick(),
					pres = $pres({ to: roomNick })
						.c('x', {xmlns: Strophe.NS.MUC});
				if (password) {
					pres.c('password').t(password);
				}
				pres.up().c('c', conn.caps.generateCapsAttrs());
				conn.send(pres.tree());
			},

			/** Function: Leave
			 * Leaves a room.
			 *
			 * Parameters:
			 *   (String) roomJid - Room to leave
			 */
			Leave: function(roomJid) {
				var user = Candy.Core.getRoom(roomJid).getUser();
				roomJid = Candy.Util.escapeJid(roomJid);
				if (user) {
					Candy.Core.getConnection().muc.leave(roomJid, user.getNick(), function() {});
				}
			},

			/** Function: Disco
			 * Requests <disco info of a room at http://xmpp.org/extensions/xep-0045.html#disco-roominfo>.
			 *
			 * Parameters:
			 *   (String) roomJid - Room to get info for
			 */
			Disco: function(roomJid) {
				Candy.Core.getConnection().sendIQ($iq({
					type: 'get',
					from: Candy.Core.getUser().getEscapedJid(),
					to: Candy.Util.escapeJid(roomJid)
				}).c('query', {xmlns: Strophe.NS.DISCO_INFO}).tree());
			},

			/** Function: Message
			 * Send message
			 *
			 * Parameters:
			 *   (String) roomJid - Room to which send the message into
			 *   (String) msg - Message
			 *   (String) type - "groupchat" or "chat" ("chat" is for private messages)
			 *
			 * Returns:
			 *   (Boolean) - true if message is not empty after trimming, false otherwise.
			 */
			Message: function(roomJid, msg, type) {
				// Trim message
				msg = $.trim(msg);
				if(msg === '') {
					return false;
				}
				Candy.Core.getConnection().muc.message(Candy.Util.escapeJid(roomJid), null, msg, null, type);
				return true;
			},

			/** Function: IgnoreUnignore
			 * Checks if the user is already ignoring the target user, if yes: unignore him, if no: ignore him.
			 *
			 * Uses the ignore privacy list set on connecting.
			 *
			 * Parameters:
			 *   (String) userJid - Target user jid
			 */
			IgnoreUnignore: function(userJid) {
				Candy.Core.getUser().addToOrRemoveFromPrivacyList('ignore', userJid);
				Candy.Core.Action.Jabber.Room.UpdatePrivacyList();
			},

			/** Function: UpdatePrivacyList
			 * Updates privacy list according to the privacylist in the currentUser
			 */
			UpdatePrivacyList: function() {
				var currentUser = Candy.Core.getUser(),
					iq = $iq({type: 'set', from: currentUser.getEscapedJid()})
						.c('query', {xmlns: 'jabber:iq:privacy' })
							.c('list', {name: 'ignore'}),
					privacyList = currentUser.getPrivacyList('ignore');
				if (privacyList.length > 0) {
					$.each(privacyList, function(index, jid) {
						iq.c('item', {type:'jid', value: Candy.Util.escapeJid(jid), action: 'deny', order : index})
							.c('message').up().up();
					});
				} else {
					iq.c('item', {action: 'allow', order : '0'});
				}
				Candy.Core.getConnection().sendIQ(iq.tree());
			},

			/** Class: Candy.Core.Action.Jabber.Room.Admin
			 * Room administration commands
			 */
			Admin: {
				/** Function: UserAction
				 * Kick or ban a user
				 *
				 * Parameters:
				 *   (String) roomJid - Room in which the kick/ban should be done
				 *   (String) userJid - Victim
				 *   (String) type - "kick" or "ban"
				 *   (String) msg - Reason
				 *
				 * Returns:
				 *   (Boolean) - true if sent successfully, false if type is not one of "kick" or "ban".
				 */
				UserAction: function(roomJid, userJid, type, reason) {
					roomJid = Candy.Util.escapeJid(roomJid);
					userJid = Candy.Util.escapeJid(userJid);
					var itemObj = {nick: Strophe.getResourceFromJid(userJid)};
					switch(type) {
						case 'kick':
							itemObj.role = 'none';
							break;
						case 'ban':
							itemObj.affiliation = 'outcast';
							break;
						default:
							return false;
					}
					Candy.Core.getConnection().sendIQ($iq({
						type: 'set',
						from: Candy.Core.getUser().getEscapedJid(),
						to: roomJid
					}).c('query', {xmlns: Strophe.NS.MUC_ADMIN })
						.c('item', itemObj).c('reason').t(reason).tree());
					return true;
				},

				/** Function: SetSubject
				 * Sets subject (topic) of a room.
				 *
				 * Parameters:
				 *   (String) roomJid - Room
				 *   (String) subject - Subject to set
				 */
				SetSubject: function(roomJid, subject) {
					Candy.Core.getConnection().muc.setTopic(Candy.Util.escapeJid(roomJid), subject);
				}
			}
		}
	};

	return self;
}(Candy.Core.Action || {}, Strophe, jQuery));
