/** File: observer.js
 * Candy - Chats are not dead yet.
 *
 * Authors:
 *   - Patrick Stadler <patrick.stadler@amiadogroup.com>
 *   - Michael Weibel <michael.weibel@amiadogroup.com>
 *
 * Copyright:
 *   (c) 2011 Amiado Group AG. All rights reserved.
 */

/** Class: Candy.View.Observer
 * Observes Candy core events
 *
 * Parameters:
 *   (Candy.View.Observer) self - itself
 *   (jQuery) $ - jQuery
 */
Candy.View.Observer = (function(self, $) {
	/** Class: Candy.View.Observer.Chat
	 * Chat events
	 */
	self.Chat = {
		/** Function: update
		 * The update method gets called whenever an event to which "Chat" is subscribed.
		 *
		 * Currently listens for connection status updates & admin messages / motd
		 *
		 * Parameters:
		 *   (Candy.Core.Event) obj - Candy core event object
		 *   (Object) args - {type, connection or message & subject}
		 */
		update: function(obj, args) {
			if(args.type === 'connection') {
				switch(args.status) {
					case Strophe.Status.CONNECTING:
					case Strophe.Status.AUTHENTICATING:
						Candy.View.Pane.Chat.Modal.show($.i18n._('statusConnecting'), false, true);
						break;
						
					case Strophe.Status.ATTACHED:
					case Strophe.Status.CONNECTED:
						Candy.View.Pane.Chat.Modal.show($.i18n._('statusConnected'));
						Candy.View.Pane.Chat.Modal.hide();
						break;

					case Strophe.Status.DISCONNECTING:
						Candy.View.Pane.Chat.Modal.show($.i18n._('statusDisconnecting'), false, true);
						break;

					case Strophe.Status.DISCONNECTED:
						Candy.View.Pane.Chat.Modal.showLoginForm($.i18n._('statusDisconnected'));
						Candy.View.Event.Chat.onDisconnect();
						break;
						
					case Strophe.Status.AUTHFAIL:
						Candy.View.Pane.Chat.Modal.showLoginForm($.i18n._('statusAuthfail'));
						Candy.View.Event.Chat.onAuthfail();
						break;

					default:
						Candy.View.Pane.Chat.Modal.show($.i18n._('status', args.status));
						break;
				}
			} else if(args.type === 'message') {
				Candy.View.Pane.Chat.adminMessage((args.subject || ''), args.message);
			} else if(args.type === 'chat' || args.type === 'groupchat') {
				// use onInfoMessage as infos from the server shouldn't be hidden by the infoMessage switch.
				Candy.View.Pane.Chat.onInfoMessage(Candy.View.getCurrent().roomJid, (args.subject || ''), args.message);
			}
		}
	};

	/** Class: Candy.View.Observer.Presence
	 * Presence update events
	 */
	self.Presence = {
		/** Function: update
		 * Every presence update gets dispatched from this method.
		 *
		 * Parameters:
		 *   (Candy.Core.Event) obj - Candy core event object
		 *   (Object) args - Arguments differ on each type
		 *
		 * Uses:
		 *   - <notifyPrivateChats>
		 */
		update: function(obj, args) {
			// Client left
			if(args.type === 'leave') {
				var user = Candy.View.Pane.Room.getUser(args.roomJid);
				Candy.View.Pane.Room.close(args.roomJid);
				self.Presence.notifyPrivateChats(user, args.type);
			// Client has been kicked or banned
			} else if (args.type === 'kick' || args.type === 'ban') {
				var actorName = Strophe.getNodeFromJid(args.actor),
					actionLabel;
				switch(args.type) {
					case 'kick':
						actionLabel = $.i18n._('youHaveBeenKickedBy', [args.roomName, actorName]);
						break;
					case 'ban':
						actionLabel = $.i18n._('youHaveBeenBannedBy', [args.roomName, actorName]);
						break;
				}
				Candy.View.Pane.Chat.Modal.show(Mustache.to_html(Candy.View.Template.Chat.Context.adminMessageReason, {
					reason: args.reason,
					_action: actionLabel,
					_reason: $.i18n._('reasonWas', [args.reason])
				}));
				setTimeout(function() {
					Candy.View.Pane.Chat.Modal.hide(function() {
						Candy.View.Pane.Room.close(args.roomJid);
						self.Presence.notifyPrivateChats(args.user, args.type);
					});
				}, 3500);
				Candy.View.Event.Room.onPresenceChange({ type: args.type, reason: args.reason, roomJid: args.roomJid, user: args.user });
			// A user changed presence
			} else {
				// Initialize room if not yet existing
				if(!Candy.View.Pane.Chat.rooms[args.roomJid]) {
					Candy.View.Pane.Room.init(args.roomJid, args.roomName);
					Candy.View.Pane.Room.show(args.roomJid);
				}
				Candy.View.Pane.Roster.update(args.roomJid, args.user, args.action, args.currentUser);
				// Notify private user chats if existing
				if(Candy.View.Pane.Chat.rooms[args.user.getJid()]) {
					Candy.View.Pane.Roster.update(args.user.getJid(), args.user, args.action, args.currentUser);
					Candy.View.Pane.PrivateRoom.setStatus(args.user.getJid(), args.action);
				}
			}
		},
		/** Function: notifyPrivateChats
		 * Notify private user chats if existing
		 *
		 * Parameters:
		 *   (Candy.Core.chatUser) user - User which has done the event
		 *   (String) type - Event type (leave, join, kick/ban)
		 */
		notifyPrivateChats: function(user, type) {
			Candy.Core.log('[View:Observer] notify Private Chats');
			var roomJid;
			for(roomJid in Candy.View.Pane.Chat.rooms) {
				if(Candy.View.Pane.Chat.rooms.hasOwnProperty(roomJid) && Candy.View.Pane.Room.getUser(roomJid) && user.getJid() === Candy.View.Pane.Room.getUser(roomJid).getJid()) {
					Candy.View.Pane.Roster.update(roomJid, user, type, user);
					Candy.View.Pane.PrivateRoom.setStatus(roomJid, type);
				}
			}
		}
	};

	/** Class: Candy.View.Observer.Message
	 * Message related events
	 */
	self.Message = {
		/** Function: update
		 * Messages received get dispatched from this method.
		 *
		 * Parameters:
		 *   (Candy.Core.Event) obj - Candy core event object
		 *   (Object) args - {message, roomJid}
		 */
		update: function(obj, args) {
			if(args.message.type === 'subject') {
				Candy.View.Pane.Room.setSubject(args.roomJid, args.message.body);
			} else {
				// Initialize room if it's a message for a new private user chat
				if(args.message.type === 'chat' && !Candy.View.Pane.Chat.rooms[args.roomJid]) {
					Candy.View.Pane.PrivateRoom.open(args.roomJid, args.message.name, false, args.message.isNoConferenceRoomJid);
				}
				Candy.View.Pane.Message.show(args.roomJid, args.message.name, args.message.body, args.timestamp);
			}
		}
	};

	/** Class: Candy.View.Observer.Login
	 * Handles when display login window should appear
	 */
	self.Login = {
		/** Function: update
		 * The login event gets dispatched to this method
		 *
		 * Parameters:
		 *   (Candy.Core.Event) obj - Candy core event object
		 *   (Object) args - {presetJid}
		 */
		update: function(obj, args) {
			Candy.View.Pane.Chat.Modal.showLoginForm(null, args.presetJid);
		}
	};

	return self;
}(Candy.View.Observer || {}, jQuery));