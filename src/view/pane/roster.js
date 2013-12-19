/** File: roster.js
 * Candy - Chats are not dead yet.
 *
 * Authors:
 *   - Patrick Stadler <patrick.stadler@gmail.com>
 *   - Michael Weibel <michael.weibel@gmail.com>
 *
 * Copyright:
 *   (c) 2011 Amiado Group AG. All rights reserved.
 *   (c) 2012, 2013 Patrick Stadler & Michael Weibel
 */

/* global Candy */
/* jshint unused:false */

/** Class: Candy.View.Pane.Roster
 * Handles everyhing regarding roster updates.
 *
 * Parameters:
 *   (Candy.View.Pane.Roster) self - itself
 */
Candy.View.Pane.Roster = (function(self, parent) {
	/** PrivateFunction: join
	 * Called by <Candy.View.Pane.Roster.update> if a user joined the room.
	 *
	 * TODO: Refactoring, this method has too much LOC.
	 *
	 * Parameters:
	 *   (String) roomId - Generated id of the room (hash)
	 *   (String) roomJid - Room JID in which the update happens
	 *   (String) userId - Generated id of the user (hash)
	 *   (Candy.Core.ChatUser) user - User on which the update happens
	 *   (jQuery.Element) userElem - User element (if existing)
	 *   (Candy.Core.ChatUser) currentUser - Current user
	 */
	var join = function join(roomId, roomJid, userId, user, userElem, currentUser) {
		var usercountDiff = 1,
			html = Mustache.to_html(Candy.View.Template.Roster.user, {
				roomId: roomId,
				userId : userId,
				userJid: user.getJid(),
				nick: user.getNick(),
				displayNick: Candy.Util.crop(user.getNick(), Candy.View.getOptions().crop.roster.nickname),
				role: user.getRole(),
				affiliation: user.getAffiliation(),
				me: currentUser !== undefined && user.getNick() === currentUser.getNick(),
				tooltipRole: $.i18n._('tooltipRole'),
				tooltipIgnored: $.i18n._('tooltipIgnored')
			});

		if(userElem.length < 1) {
			var userInserted = false,
				rosterPane = parent.Room.getPane(roomJid, '.roster-pane'),
				userCount = rosterPane.children().length,
				disableSortingThreshold = Candy.View.getOption('bigroom').disableSortingThreshold;
			// there are already users in the roster
			if(userCount > 0 && (disableSortingThreshold === -1 || disableSortingThreshold >= userCount)) {
				// insert alphabetically
				var userSortCompare = user.getNick().toUpperCase();
				rosterPane.children().each(function() {
					var elem = $(this);
					if(elem.attr('data-nick').toUpperCase() > userSortCompare) {
						elem.before(html);
						userInserted = true;
						return false;
					}
					return true;
				});
			}
			// first user in roster or if sorting is disabled
			if(!userInserted) {
				rosterPane.append(html);
			}

			self.joinAnimation('user-' + roomId + '-' + userId);
			// only show other users joining & don't show if there's no message in the room.
			if(currentUser !== undefined && user.getNick() !== currentUser.getNick() && parent.Room.getUser(roomJid)) {
				// always show join message in private room, even if status messages have been disabled
				if (parent.Chat.rooms[roomJid].type === 'chat') {
					parent.Chat.onInfoMessage(roomJid, $.i18n._('userJoinedRoom', [user.getNick()]));
				} else {
					parent.Chat.infoMessage(roomJid, $.i18n._('userJoinedRoom', [user.getNick()]));
				}
			}
		// user is in room but maybe the affiliation/role has changed
		} else {
			usercountDiff = 0;
			userElem.replaceWith(html);
			$('#user-' + roomId + '-' + userId).css({opacity: 1}).show();
			// it's me, update the toolbar
			if(currentUser !== undefined && user.getNick() === currentUser.getNick() && parent.Room.getUser(roomJid)) {
				parent.Chat.Toolbar.update(roomJid);
			}
		}

		// Presence of client
		if (currentUser !== undefined && currentUser.getNick() === user.getNick()) {
			parent.Room.setUser(roomJid, user);
		// add click handler for private chat
		} else {
			$('#user-' + roomId + '-' + userId).click(self.userClick);
		}

		$('#user-' + roomId + '-' + userId + ' .context').click(function(e) {
			parent.Chat.Context.show(e.currentTarget, roomJid, user);
			e.stopPropagation();
		});

		// check if current user is ignoring the user who has joined.
		if (currentUser !== undefined && currentUser.isInPrivacyList('ignore', user.getJid())) {
			Candy.View.Pane.Room.addIgnoreIcon(roomJid, user.getJid());
		}

		return usercountDiff;
	};

	/** Function: update
	 * Called by <Candy.View.Observer.Presence.update> to update the roster if needed.
	 * Adds/removes users from the roster list or updates informations on their items (roles, affiliations etc.)
	 *
	 * TODO: Refactoring, this method has too much LOC.
	 *
	 * Parameters:
	 *   (String) roomJid - Room JID in which the update happens
	 *   (Candy.Core.ChatUser) user - User on which the update happens
	 *   (String) action - one of "join", "leave", "kick" and "ban"
	 *   (Candy.Core.ChatUser) currentUser - Current user
	 *
	 * Triggers:
	 *   candy:view.roster.before-update using {roomJid, user, action, element}
	 *   candy:view.roster.after-update using {roomJid, user, action, element}
	 */
	self.update = function update(roomJid, user, action, currentUser) {
		var roomId = parent.Chat.rooms[roomJid].id,
			userId = Candy.Util.jidToId(user.getJid()),
			usercountDiff = -1,
			userElem = $('#user-' + roomId + '-' + userId);

		var evtData = {'roomJid': roomJid, type: null, 'user': user};

		/** Event: candy:view.roster.before-update
		 * Before updating the roster of a room
		 *
		 * Parameters:
		 *   (String) roomJid - Room JID
		 *   (Candy.Core.ChatUser) user - User
		 *   (String) action - [join, leave, kick, ban]
		 *   (jQuery.Element) element - User element
		 */
		$(Candy).triggerHandler('candy:view.roster.before-update', {
			'roomJid' : roomJid,
			'user' : user,
			'action': action,
			'element': userElem
		});

		// a user joined the room
		if(action === 'join') {
			usercountDiff += join(roomId, roomJid, userId, user, userElem, currentUser);
		// a user left the room
		} else if(action === 'leave') {
			self.leaveAnimation('user-' + roomId + '-' + userId);
			// always show leave message in private room, even if status messages have been disabled
			if (parent.Chat.rooms[roomJid].type === 'chat') {
				parent.Chat.onInfoMessage(roomJid, $.i18n._('userLeftRoom', [user.getNick()]));
			} else {
				parent.Chat.infoMessage(roomJid, $.i18n._('userLeftRoom', [user.getNick()]));
			}
		// user has been kicked
		} else if(action === 'kick') {
			self.leaveAnimation('user-' + roomId + '-' + userId);
			parent.Chat.onInfoMessage(roomJid, $.i18n._('userHasBeenKickedFromRoom', [user.getNick()]));
		// user has been banned
		} else if(action === 'ban') {
			self.leaveAnimation('user-' + roomId + '-' + userId);
			parent.Chat.onInfoMessage(roomJid, $.i18n._('userHasBeenBannedFromRoom', [user.getNick()]));
		}

		// Update user count
		Candy.View.Pane.Chat.rooms[roomJid].usercount += usercountDiff;

		if(roomJid === Candy.View.getCurrent().roomJid) {
			Candy.View.Pane.Chat.Toolbar.updateUsercount(Candy.View.Pane.Chat.rooms[roomJid].usercount);
		}

		evtData = {
			'roomJid' : roomJid,
			'user' : user,
			'action': action,
			'element': $('#user-' + roomId + '-' + userId)
		};

		// deprecated
		Candy.View.Event.Roster.onUpdate(evtData);

		/** Event: candy:view.roster.after-update
		 * After updating a room's roster
		 *
		 * Parameters:
		 *   (String) roomJid - Room JID
		 *   (Candy.Core.ChatUser) user - User
		 *   (String) action - [join, leave, kick, ban]
		 *   (jQuery.Element) element - User element
		 */
		$(Candy).triggerHandler('candy:view.roster.after-update', evtData);
	};

	/** Function: userClick
	 * Click handler for opening a private room
	 */
	self.userClick = function userClick() {
		var elem = $(this);
		parent.PrivateRoom.open(elem.attr('data-jid'), elem.attr('data-nick'), true);
	};

	/** Function: joinAnimation
	 * Animates specified elementId on join
	 *
	 * Parameters:
	 *   (String) elementId - Specific element to do the animation on
	 */
	self.joinAnimation = function joinAnimation(elementId) {
		var roomJid = Candy.View.getCurrent().roomJid;
		var roomUserCount = Candy.View.Pane.Chat.rooms[roomJid].usercount;

		if(roomUserCount >= Candy.View.getOption('bigroom').disableAnimationThreshold) {
			$('#' + elementId).show().css("opacity", 1);
		} else {
			$('#' + elementId).stop(true).slideDown('normal', function() { $(this).animate({ opacity: 1 }); });
		}
	};

	/** Function: leaveAnimation
	 * Leave animation for specified element id and removes the DOM element on completion.
	 *
	 * Parameters:
	 *   (String) elementId - Specific element to do the animation on
	 */
	self.leaveAnimation = function leaveAnimation(elementId) {
		var roomJid = Candy.View.getCurrent().roomJid;
		var roomUserCount = Candy.View.Pane.Chat.rooms[roomJid].usercount;

		if(roomUserCount >= Candy.View.getOption('bigroom').disableAnimationThreshold) {
			$('#' + elementId).stop(true).remove();
		} else {
			$('#' + elementId).stop(true).attr('id', '#' + elementId + '-leaving').animate({ opacity: 0 }, {
				complete: function() {
					$(this).slideUp('normal', function() { $(this).remove(); });
				}
			});
		}
	};

	return self;
}(Candy.View.Pane.Roster || {}, Candy.View.Pane));