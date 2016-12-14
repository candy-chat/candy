/** File: roster.js
 * Candy - Chats are not dead yet.
 *
 * Legal: See the LICENSE file at the top-level directory of this distribution and at https://github.com/candy-chat/candy/blob/master/LICENSE
 */
'use strict';

/* global Candy, Mustache, Strophe, jQuery */

/** Class: Candy.View.Pane
 * Candy view pane handles everything regarding DOM updates etc.
 *
 * Parameters:
 *   (Candy.View.Pane) self - itself
 *   (jQuery) $ - jQuery
 */
Candy.View.Pane = (function(self, $) {

  /** Class Candy.View.Pane.Roster
   * Handles everyhing regarding roster updates.
   */
  self.Roster = {
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
    update: function(roomJid, user, action, currentUser) {
      Candy.Core.log('[View:Pane:Roster] ' + action);
      var roomId = self.Chat.rooms[roomJid].id,
        userId = Candy.Util.jidToId(user.getJid()),
        usercountDiff = -1,
        userElem = $('#user-' + roomId + '-' + userId),
        evtData = {
          'roomJid' : roomJid,
          'user' : user,
          'action': action,
          'element': userElem
        };

      /** Event: candy:view.roster.before-update
       * Before updating the roster of a room
       *
       * Parameters:
       *   (String) roomJid - Room JID
       *   (Candy.Core.ChatUser) user - User
       *   (String) action - [join, leave, kick, ban]
       *   (jQuery.Element) element - User element
       */
      $(Candy).triggerHandler('candy:view.roster.before-update', evtData);

      // a user joined the room
      if(action === 'join') {
        usercountDiff = 1;

        if(userElem.length < 1) {
          self.Roster._insertUser(roomJid, roomId, user, userId, currentUser);
          self.Roster.showJoinAnimation(user, userId, roomId, roomJid, currentUser);
        // user is in room but maybe the affiliation/role has changed
        } else {
          usercountDiff = 0;
          userElem.remove();
          self.Roster._insertUser(roomJid, roomId, user, userId, currentUser);
          // it's me, update the toolbar
          if(currentUser !== undefined && user.getNick() === currentUser.getNick() && self.Room.getUser(roomJid)) {
            self.Chat.Toolbar.update(roomJid);
          }
        }

        // Presence of client
        if (currentUser !== undefined && currentUser.getNick() === user.getNick()) {
          self.Room.setUser(roomJid, user);
        // add click handler for private chat
        } else {
          $('#user-' + roomId + '-' + userId).click(self.Roster.userClick);
        }

        $('#user-' + roomId + '-' + userId + ' .context').click(function(e) {
          self.Chat.Context.show(e.currentTarget, roomJid, user);
          e.stopPropagation();
        });

        // check if current user is ignoring the user who has joined.
        if (currentUser !== undefined && currentUser.isInPrivacyList('ignore', user.getJid())) {
          Candy.View.Pane.Room.addIgnoreIcon(roomJid, user.getJid());
        }
      // a user left the room
      } else if(action === 'leave') {
        self.Roster.leaveAnimation('user-' + roomId + '-' + userId);
        // always show leave message in private room, even if status messages have been disabled
        if (self.Chat.rooms[roomJid].type === 'chat') {
          self.Chat.onInfoMessage(roomJid, null, $.i18n._('userLeftRoom', [user.getNick()]));
        } else {
          self.Chat.infoMessage(roomJid, null, $.i18n._('userLeftRoom', [user.getNick()]), '');
        }

      } else if(action === 'nickchange') {
        usercountDiff = 0;
        self.Roster.changeNick(roomId, user);
        self.Room.changeDataUserJidIfUserIsMe(roomId, user);
        self.PrivateRoom.changeNick(roomJid, user);
        var infoMessage = $.i18n._('userChangedNick', [user.getPreviousNick(), user.getNick()]);
        self.Chat.infoMessage(roomJid, null, infoMessage);
      // user has been kicked
      } else if(action === 'kick') {
        self.Roster.leaveAnimation('user-' + roomId + '-' + userId);
        self.Chat.onInfoMessage(roomJid, null, $.i18n._('userHasBeenKickedFromRoom', [user.getNick()]));
      // user has been banned
      } else if(action === 'ban') {
        self.Roster.leaveAnimation('user-' + roomId + '-' + userId);
        self.Chat.onInfoMessage(roomJid, null, $.i18n._('userHasBeenBannedFromRoom', [user.getNick()]));
      }

      // Update user count
      Candy.View.Pane.Chat.rooms[roomJid].usercount += usercountDiff;

      if(roomJid === Candy.View.getCurrent().roomJid) {
        Candy.View.Pane.Chat.Toolbar.updateUsercount(Candy.View.Pane.Chat.rooms[roomJid].usercount);
      }


      // in case there's been a join, the element is now there (previously not)
      evtData.element = $('#user-' + roomId + '-' + userId);
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
    },

    _insertUser: function(roomJid, roomId, user, userId, currentUser) {
      var contact = user.getContact();
      var html = Mustache.to_html(Candy.View.Template.Roster.user, {
          roomId: roomId,
          userId : userId,
          userJid: user.getJid(),
          realJid: user.getRealJid(),
          status: user.getStatus(),
          contact_status: contact ? contact.getStatus() : 'unavailable',
          nick: user.getNick(),
          displayNick: Candy.Util.crop(user.getNick(), Candy.View.getOptions().crop.roster.nickname),
          role: user.getRole(),
          affiliation: user.getAffiliation(),
          me: currentUser !== undefined && user.getNick() === currentUser.getNick(),
          tooltipRole: $.i18n._('tooltipRole'),
          tooltipIgnored: $.i18n._('tooltipIgnored')
        });

      var $html = $(html);
      $html.css('display', 'block');
      $html.css('opacity', 1);

      var userInserted = false,
        rosterPane = self.Room.getPane(roomJid, '.roster-pane');

      // there are already users in the roster
      if(rosterPane.children().length > 0) {
        // insert alphabetically, sorted by status
        var userSortCompare = self.Roster._userSortCompare(user.getNick(), user.getStatus());
        rosterPane.children().each(function() {
          var elem = $(this);
          if(self.Roster._userSortCompare(elem.attr('data-nick'), elem.attr('data-status')) > userSortCompare) {
            elem.before($html);
            userInserted = true;
            return false;
          }
          return true;
        });
      }
      // first user in roster
      if(!userInserted) {
        rosterPane.append(html);
      }
    },

    _userSortCompare: function(nick, status) {
      var statusWeight;
      switch (status) {
        case 'available':
          statusWeight = 1;
          break;
        case 'unavailable':
          statusWeight = 9;
          break;
        default:
          statusWeight = 8;
      }
      return statusWeight + nick.toUpperCase();
    },

    /** Function: userClick
     * Click handler for opening a private room
     */
    userClick: function() {
      var elem = $(this),
        realJid = elem.attr('data-real-jid'),
        useRealJid = Candy.Core.getOptions().useParticipantRealJid && (realJid !== undefined && realJid !== null && realJid !== ''),
        targetJid = useRealJid && realJid ? Strophe.getBareJidFromJid(realJid) : elem.attr('data-jid');
      self.PrivateRoom.open(targetJid, elem.attr('data-nick'), true, useRealJid);
    },

    /** Function: showJoinAnimation
     * Shows join animation if needed
     *
     * FIXME: Refactor. Part of this will be done by the big room improvements
     */
    showJoinAnimation: function(user, userId, roomId, roomJid, currentUser) {
      // don't show if the user has recently changed the nickname.
      var rosterUserId = 'user-' + roomId + '-' + userId,
        $rosterUserElem = $('#' + rosterUserId);
      if (!user.getPreviousNick() || !$rosterUserElem || $rosterUserElem.is(':visible') === false) {
        self.Roster.joinAnimation(rosterUserId);
        // only show other users joining & don't show if there's no message in the room.
        if(currentUser !== undefined && user.getNick() !== currentUser.getNick() && self.Room.getUser(roomJid)) {
          // always show join message in private room, even if status messages have been disabled
          if (self.Chat.rooms[roomJid].type === 'chat') {
            self.Chat.onInfoMessage(roomJid, null, $.i18n._('userJoinedRoom', [user.getNick()]));
          } else {
            self.Chat.infoMessage(roomJid, null, $.i18n._('userJoinedRoom', [user.getNick()]));
          }
        }
      }
    },

    /** Function: joinAnimation
     * Animates specified elementId on join
     *
     * Parameters:
     *   (String) elementId - Specific element to do the animation on
     */
    joinAnimation: function(elementId) {
      $('#' + elementId).stop(true).slideDown('normal', function() {
        $(this).animate({opacity: 1});
      });
    },

    /** Function: leaveAnimation
     * Leave animation for specified element id and removes the DOM element on completion.
     *
     * Parameters:
     *   (String) elementId - Specific element to do the animation on
     */
    leaveAnimation: function(elementId) {
      $('#' + elementId).stop(true).attr('id', '#' + elementId + '-leaving').animate({opacity: 0}, {
        complete: function() {
          $(this).slideUp('normal', function() {
            $(this).remove();
          });
        }
      });
    },

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
    changeNick: function(roomId, user) {
      Candy.Core.log('[View:Pane:Roster] changeNick');
      var previousUserJid = Strophe.getBareJidFromJid(user.getJid()) + '/' + user.getPreviousNick(),
        elementId = 'user-' + roomId + '-' + Candy.Util.jidToId(previousUserJid),
        el = $('#' + elementId);

      el.attr('data-nick', user.getNick());
      el.attr('data-jid', user.getJid());
      el.children('div.label').text(user.getNick());
      el.attr('id', 'user-' + roomId + '-' + Candy.Util.jidToId(user.getJid()));
    }
  };

  return self;
}(Candy.View.Pane || {}, jQuery));
