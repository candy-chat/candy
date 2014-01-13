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

/* global Candy, $, Mustache, Strophe */
/* jshint unused:false */

/** Class: Candy.View.Pane.Roster
 * Handles everyhing regarding roster updates.
 *
 * Parameters:
 *   (Candy.View.Pane.Roster) self - itself
 */
Candy.View.Pane.Roster = (function(self, parent) {
	var _batchRosterUpdateTimeout,
		_batchRosterUpdateList = {},

		_batchRosterUpdateCallback = function _batchRosterUpdateCallback() {
			var newTimeout = false,
				batchRosterOpts = Candy.View.getOption('bigroom').batchRosterUpdate,
				threshold = batchRosterOpts.threshold;
			var updateList = _batchRosterUpdateList;
			_batchRosterUpdateList = {};
			$.each(updateList, function(roomId, users) {
				var rosterPane = $('#chat-room-' + roomId + ' .roster-pane');
				rosterPane.append(users);
				var children = rosterPane.children();
				children.sort(function(a, b) {
					return $(a).attr('data-nick').toUpperCase().localeCompare($(b).attr('data-nick').toUpperCase());
				});
				if(children.length > threshold) {
					newTimeout = true;
				}
				children.show().css("opacity", 1);
			});
			if(newTimeout) {
				_batchRosterUpdateTimeout = setTimeout(_batchRosterUpdateCallback,
					batchRosterOpts.interval);
			} else {
				_batchRosterUpdateTimeout = null;
			}
		};


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
				bigroomOpts = Candy.View.getOption('bigroom'),
				disableSortingThreshold = bigroomOpts.disableSortingThreshold,
				batchRosterUpdateThreshold = bigroomOpts.batchRosterUpdate.threshold;

			if(userCount > batchRosterUpdateThreshold) {
				if(!_batchRosterUpdateList[roomId]) {
					_batchRosterUpdateList[roomId] = [];
				}
				_batchRosterUpdateList[roomId].push(html);
				if(!_batchRosterUpdateTimeout) {
					_batchRosterUpdateTimeout = setTimeout(_batchRosterUpdateCallback, bigroomOpts.batchRosterUpdate.interval);
				}
			} else {
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

				self.showJoinAnimation(user, userId, roomId, roomJid);
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
		Candy.Core.log('[View:Pane:Roster] ' + action);
		var roomId = parent.Chat.rooms[roomJid].id,
			userId = Candy.Util.jidToId(user.getJid()),
			usercountDiff = -1,
			userElem = $('#user-' + roomId + '-' + userId);

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
		} else if(action === 'nickchange') {
			usercountDiff = 0;
			self.changeNick(roomId, user);
			parent.Room.changeDataUserJidIfUserIsMe(roomId, user);
			parent.PrivateRoom.changeNick(roomJid, user);
			var infoMessage = $.i18n._('userChangedNick', [user.getPreviousNick(), user.getNick()]);
			parent.Chat.onInfoMessage(roomJid, infoMessage);
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

		/** Event: candy:view.roster.after-update
		 * After updating a room's roster
		 *
		 * Parameters:
		 *   (String) roomJid - Room JID
		 *   (Candy.Core.ChatUser) user - User
		 *   (String) action - [join, leave, kick, ban]
		 *   (jQuery.Element) element - User element
		 */
		$(Candy).triggerHandler('candy:view.roster.after-update', {
			'roomJid' : roomJid,
			'user' : user,
			'action': action,
			'element': $('#user-' + roomId + '-' + userId)
		});
	};

	/** Function: userClick
	 * Click handler for opening a private room
	 */
	self.userClick = function userClick() {
		var elem = $(this);
		parent.PrivateRoom.open(elem.attr('data-jid'), elem.attr('data-nick'), true);
	};

	self.showJoinAnimation = function(user, userId, roomId, roomJid, currentUser) {
		// don't show if the user has recently changed the nickname.
		var rosterUserId = 'user-' + roomId + '-' + userId,
			$rosterUserElem = $('#' + rosterUserId);
		if (!user.getPreviousNick() || !$rosterUserElem || $rosterUserElem.is(':visible') === false) {
			self.joinAnimation(rosterUserId);
			// only show other users joining & don't show if there's no message in the room.
			if(currentUser !== undefined && user.getNick() !== currentUser.getNick() && self.Room.getUser(roomJid)) {
				// always show join message in private room, even if status messages have been disabled
				if (parent.Chat.rooms[roomJid].type === 'chat') {
					parent.Chat.onInfoMessage(roomJid, $.i18n._('userJoinedRoom', [user.getNick()]));
				} else {
					parent.Chat.infoMessage(roomJid, $.i18n._('userJoinedRoom', [user.getNick()]));
				}
			}
		}
	};

	/** Function: joinAnimation
	 * Animates specified elementId on join
	 *
	 * Parameters:
	 *   (String) elementId - Specific element to do the animation on
	 */
	self.joinAnimation = function joinAnimation(elementId) {
		var roomJid = Candy.View.getCurrent().roomJid,
			roomUserCount = Candy.View.Pane.Chat.rooms[roomJid].usercount;
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

	/** Function: changeNick
	 * Change nick of an existing user in the roster
	 *
	 * UserId has to be recalculated from the user because at the time of this call,
	 * the user is already set with the new jid & nick.
	 *
	 * Parameters:
	 *   (String) roomId - Id of the room
	 *   (Candy.Core.ChatUser) user - User object
	 */
	self.changeNick = function(roomId, user) {
		Candy.Core.log('[View:Pane:Roster] changeNick');
		var previousUserJid = Strophe.getBareJidFromJid(user.getJid()) + '/' + user.getPreviousNick(),
		elementId = 'user-' + roomId + '-' + Candy.Util.jidToId(previousUserJid),
		el = $('#' + elementId);

		el.attr('data-nick', user.getNick());
		el.attr('data-jid', user.getJid());
		el.children('div.label').text(user.getNick());
		el.attr('id', 'user-' + roomId + '-' + Candy.Util.jidToId(user.getJid()));
	};

	return self;
}(Candy.View.Pane.Roster || {}, Candy.View.Pane));