/** File: room.js
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

  /** Class: Candy.View.Pane.Room
   * Everything which belongs to room view things belongs here.
   */
  self.Room = {
    /** Function: init
     * Initialize a new room and inserts the room html into the DOM
     *
     * Parameters:
     *   (String) roomJid - Room JID
     *   (String) roomName - Room name
     *   (String) roomType - Type: either "groupchat" or "chat" (private chat)
     *
     * Uses:
     *   - <Candy.Util.jidToId>
     *   - <Candy.View.Pane.Chat.addTab>
     *   - <getPane>
     *
     * Triggers:
     *   candy:view.room.after-add using {roomJid, type, element}
     *
     * Returns:
     *   (String) - the room id of the element created.
     */
    init: function(roomJid, roomName, roomType) {
      roomType = roomType || 'groupchat';
      roomJid = Candy.Util.unescapeJid(roomJid);

      var evtData = {
        roomJid: roomJid,
        type: roomType
      };
      /** Event: candy:view.room.before-add
       * Before initialising a room
       *
       * Parameters:
       *   (String) roomJid - Room JID
       *   (String) type - Room Type
       *
       * Returns:
       *   Boolean - if you don't want to initialise the room, return false.
       */
      if($(Candy).triggerHandler('candy:view.room.before-add', evtData) === false) {
        return false;
      }

      // First room, show sound control
      if(Candy.Util.isEmptyObject(self.Chat.rooms)) {
        self.Chat.Toolbar.show();
        self.Chat.showMobileIcon();
      }

      var roomId = Candy.Util.jidToId(roomJid);
      self.Chat.rooms[roomJid] = {id: roomId, usercount: 0, name: roomName, type: roomType, messageCount: 0, scrollPosition: -1, targetJid: roomJid};

      $('#chat-rooms').append(Mustache.to_html(Candy.View.Template.Room.pane, {
        roomId: roomId,
        roomJid: roomJid,
        roomType: roomType,
        form: {
          _messageSubmit: $.i18n._('messageSubmit')
        },
        roster: {
          _userOnline: $.i18n._('userOnline')
        }
      }, {
        roster: Candy.View.Template.Roster.pane,
        messages: Candy.View.Template.Message.pane,
        form: Candy.View.Template.Room.form
      }));
      self.Chat.addTab(roomJid, roomName, roomType);
      self.Room.getPane(roomJid, '.message-form').submit(self.Message.submit);
      self.Room.scrollToBottom(roomJid);

      evtData.element = self.Room.getPane(roomJid);

      /** Event: candy:view.room.after-add
       * After initialising a room
       *
       * Parameters:
       *   (String) roomJid - Room JID
       *   (String) type - Room Type
       *   (jQuery.Element) element - Room element
       */
      $(Candy).triggerHandler('candy:view.room.after-add', evtData);

      return roomId;
    },

    /** Function: show
     * Show a specific room and hides the other rooms (if there are any)
     *
     * Parameters:
     *   (String) roomJid - room jid to show
     *
     * Triggers:
     *   candy:view.room.after-show using {roomJid, element}
     *   candy:view.room.after-hide using {roomJid, element}
     */
    show: function(roomJid) {
      var roomId = self.Chat.rooms[roomJid].id,
        evtData;

      $('.room-pane').each(function() {
        var elem = $(this);
        evtData = {
          'roomJid': elem.attr('data-roomjid'),
          'type': elem.attr('data-roomtype'),
          'element' : elem
        };

        if(elem.attr('id') === ('chat-room-' + roomId)) {
          elem.show();
          Candy.View.getCurrent().roomJid = roomJid;
          self.Chat.setActiveTab(roomJid);
          self.Chat.Toolbar.update(roomJid);
          self.Chat.clearUnreadMessages(roomJid);
          self.Room.setFocusToForm(roomJid);
          self.Room.scrollToBottom(roomJid);

          /** Event: candy:view.room.after-show
           * After showing a room
           *
           * Parameters:
           *   (String) roomJid - Room JID
           *   (String) type - Room Type
           *   (jQuery.Element) element - Room element
           */
          $(Candy).triggerHandler('candy:view.room.after-show', evtData);

        } else {
          elem.hide();

          /** Event: candy:view.room.after-hide
           * After hiding a room
           *
           * Parameters:
           *   (String) roomJid - Room JID
           *   (String) type - Room Type
           *   (jQuery.Element) element - Room element
           */
          $(Candy).triggerHandler('candy:view.room.after-hide', evtData);
        }
      });
    },

    /** Function: setSubject
     * Called when someone changes the subject in the channel
     *
     * Triggers:
     *   candy:view.room.after-subject-change using {roomJid, element, subject}
     *
     * Parameters:
     *   (String) roomJid - Room Jid
     *   (String) subject - The new subject
     */
    setSubject: function(roomJid, subject) {
      subject = Candy.Util.Parser.linkify(Candy.Util.Parser.escape(subject));
      var timestamp = new Date();
      var html = Mustache.to_html(Candy.View.Template.Room.subject, {
        subject: subject,
        roomName: self.Chat.rooms[roomJid].name,
        _roomSubject: $.i18n._('roomSubject'),
        time: Candy.Util.localizedTime(timestamp),
        timestamp: timestamp.toISOString()
      });
      self.Room.appendToMessagePane(roomJid, html);
      self.Room.scrollToBottom(roomJid);

      /** Event: candy:view.room.after-subject-change
       * After changing the subject of a room
       *
       * Parameters:
       *   (String) roomJid - Room JID
       *   (jQuery.Element) element - Room element
       *   (String) subject - New subject
       */
      $(Candy).triggerHandler('candy:view.room.after-subject-change', {
        'roomJid': roomJid,
        'element' : self.Room.getPane(roomJid),
        'subject' : subject
      });
    },

    /** Function: close
     * Close a room and remove everything in the DOM belonging to this room.
     *
     * NOTICE: There's a rendering bug in Opera when all rooms have been closed.
     *         (Take a look in the source for a more detailed description)
     *
     * Triggers:
     *   candy:view.room.after-close using {roomJid}
     *
     * Parameters:
     *   (String) roomJid - Room to close
     */
    close: function(roomJid) {
      self.Chat.removeTab(roomJid);
      self.Window.clearUnreadMessages();

      /* TODO:
        There's a rendering bug in Opera which doesn't redraw (remove) the message form.
        Only a cosmetical issue (when all tabs are closed) but it's annoying...
        This happens when form has no focus too. Maybe it's because of CSS positioning.
      */
      self.Room.getPane(roomJid).remove();
      var openRooms = $('#chat-rooms').children();
      if(Candy.View.getCurrent().roomJid === roomJid) {
        Candy.View.getCurrent().roomJid = null;
        if(openRooms.length === 0) {
          self.Chat.allTabsClosed();
        } else {
          self.Room.show(openRooms.last().attr('data-roomjid'));
        }
      }
      delete self.Chat.rooms[roomJid];

      /** Event: candy:view.room.after-close
       * After closing a room
       *
       * Parameters:
       *   (String) roomJid - Room JID
       */
      $(Candy).triggerHandler('candy:view.room.after-close', {
        'roomJid' : roomJid
      });
    },

    /** Function: appendToMessagePane
     * Append a new message to the message pane.
     *
     * Parameters:
     *   (String) roomJid - Room JID
     *   (String) html - rendered message html
     */
    appendToMessagePane: function(roomJid, html) {
      self.Room.getPane(roomJid, '.message-pane').append(html);
      self.Chat.rooms[roomJid].messageCount++;
      self.Room.sliceMessagePane(roomJid);
    },

    /** Function: sliceMessagePane
     * Slices the message pane after the max amount of messages specified in the Candy View options (limit setting).
     *
     * This is done to hopefully prevent browsers from getting slow after a certain amount of messages in the DOM.
     *
     * The slice is only done when autoscroll is on, because otherwise someone might lose exactly the message he want to look for.
     *
     * Parameters:
     *   (String) roomJid - Room JID
     */
    sliceMessagePane: function(roomJid) {
      // Only clean if autoscroll is enabled
      if(self.Window.autoscroll) {
        var options = Candy.View.getOptions().messages;
        if(self.Chat.rooms[roomJid].messageCount > options.limit) {
          self.Room.getPane(roomJid, '.message-pane').children().slice(0, options.remove).remove();
          self.Chat.rooms[roomJid].messageCount -= options.remove;
        }
      }
    },

    /** Function: scrollToBottom
     * Scroll to bottom wrapper for <onScrollToBottom> to be able to disable it by overwriting the function.
     *
     * Parameters:
     *   (String) roomJid - Room JID
     *
     * Uses:
     *   - <onScrollToBottom>
     */
    scrollToBottom: function(roomJid) {
      self.Room.onScrollToBottom(roomJid);
    },

    /** Function: onScrollToBottom
     * Scrolls to the latest message received/sent.
     *
     * Parameters:
     *   (String) roomJid - Room JID
     */
    onScrollToBottom: function(roomJid) {
      var messagePane = self.Room.getPane(roomJid, '.message-pane-wrapper');

      if (Candy.View.Pane.Chat.rooms[roomJid].enableScroll === true) {
        messagePane.scrollTop(messagePane.prop('scrollHeight'));
      } else {
        return false;
      }
    },

    /** Function: onScrollToStoredPosition
     * When autoscroll is off, the position where the scrollbar is has to be stored for each room, because it otherwise
     * goes to the top in the message window.
     *
     * Parameters:
     *   (String) roomJid - Room JID
     */
    onScrollToStoredPosition: function(roomJid) {
      // This should only apply when entering a room...
      // ... therefore we set scrollPosition to -1 after execution.
      if(self.Chat.rooms[roomJid].scrollPosition > -1) {
        var messagePane = self.Room.getPane(roomJid, '.message-pane-wrapper');
        messagePane.scrollTop(self.Chat.rooms[roomJid].scrollPosition);
        self.Chat.rooms[roomJid].scrollPosition = -1;
      }
    },

    /** Function: setFocusToForm
     * Set focus to the message input field within the message form.
     *
     * Parameters:
     *   (String) roomJid - Room JID
     */
    setFocusToForm: function(roomJid) {
      // If we're on mobile, don't focus the input field.
      if (Candy.Util.isMobile()) { return true; }

      var pane = self.Room.getPane(roomJid, '.message-form');
      if (pane) {
        // IE8 will fail maybe, because the field isn't there yet.
        try {
          pane.children('.field')[0].focus();
        } catch(e) {
          // fail silently
        }
      }
    },

    /** Function: setUser
     * Sets or updates the current user in the specified room (called by <Candy.View.Pane.Roster.update>) and set specific informations
     * (roles and affiliations) on the room tab (chat-pane).
     *
     * Parameters:
     *   (String) roomJid - Room in which the user is set to.
     *   (Candy.Core.ChatUser) user - The user
     */
    setUser: function(roomJid, user) {
      self.Chat.rooms[roomJid].user = user;
      var roomPane = self.Room.getPane(roomJid),
        chatPane = $('#chat-pane');

      roomPane.attr('data-userjid', user.getJid());
      // Set classes based on user role / affiliation
      if(user.isModerator()) {
        if (user.getRole() === user.ROLE_MODERATOR) {
          chatPane.addClass('role-moderator');
        }
        if (user.getAffiliation() === user.AFFILIATION_OWNER) {
          chatPane.addClass('affiliation-owner');
        }
      } else {
        chatPane.removeClass('role-moderator affiliation-owner');
      }
      self.Chat.Context.init();
    },

    /** Function: getUser
     * Get the current user in the room specified with the jid
     *
     * Parameters:
     *   (String) roomJid - Room of which the user should be returned from
     *
     * Returns:
     *   (Candy.Core.ChatUser) - user
     */
    getUser: function(roomJid) {
      return self.Chat.rooms[roomJid].user;
    },

    /** Function: ignoreUser
     * Ignore specified user and add the ignore icon to the roster item of the user
     *
     * Parameters:
     *   (String) roomJid - Room in which the user should be ignored
     *   (String) userJid - User which should be ignored
     */
    ignoreUser: function(roomJid, userJid) {
      Candy.Core.Action.Jabber.Room.IgnoreUnignore(userJid);
      Candy.View.Pane.Room.addIgnoreIcon(roomJid, userJid);
    },

    /** Function: unignoreUser
     * Unignore an ignored user and remove the ignore icon of the roster item.
     *
     * Parameters:
     *   (String) roomJid - Room in which the user should be unignored
     *   (String) userJid - User which should be unignored
     */
    unignoreUser: function(roomJid, userJid) {
      Candy.Core.Action.Jabber.Room.IgnoreUnignore(userJid);
      Candy.View.Pane.Room.removeIgnoreIcon(roomJid, userJid);
    },

    /** Function: addIgnoreIcon
     * Add the ignore icon to the roster item of the specified user
     *
     * Parameters:
     *   (String) roomJid - Room in which the roster item should be updated
     *   (String) userJid - User of which the roster item should be updated
     */
    addIgnoreIcon: function(roomJid, userJid) {
      if (Candy.View.Pane.Chat.rooms[userJid]) {
        $('#user-' + Candy.View.Pane.Chat.rooms[userJid].id + '-' + Candy.Util.jidToId(userJid)).addClass('status-ignored');
      }
      if (Candy.View.Pane.Chat.rooms[Strophe.getBareJidFromJid(roomJid)]) {
        $('#user-' + Candy.View.Pane.Chat.rooms[Strophe.getBareJidFromJid(roomJid)].id + '-' + Candy.Util.jidToId(userJid)).addClass('status-ignored');
      }
    },

    /** Function: removeIgnoreIcon
     * Remove the ignore icon to the roster item of the specified user
     *
     * Parameters:
     *   (String) roomJid - Room in which the roster item should be updated
     *   (String) userJid - User of which the roster item should be updated
     */
    removeIgnoreIcon: function(roomJid, userJid) {
      if (Candy.View.Pane.Chat.rooms[userJid]) {
        $('#user-' + Candy.View.Pane.Chat.rooms[userJid].id + '-' + Candy.Util.jidToId(userJid)).removeClass('status-ignored');
      }
      if (Candy.View.Pane.Chat.rooms[Strophe.getBareJidFromJid(roomJid)]) {
        $('#user-' + Candy.View.Pane.Chat.rooms[Strophe.getBareJidFromJid(roomJid)].id + '-' + Candy.Util.jidToId(userJid)).removeClass('status-ignored');
      }
    },

    /** Function: getPane
     * Get the chat room pane or a subPane of it (if subPane is specified)
     *
     * Parameters:
     *   (String) roomJid - Room in which the pane lies
     *   (String) subPane - Sub pane of the chat room pane if needed [optional]
     */
    getPane: function(roomJid, subPane) {
      if (self.Chat.rooms[roomJid]) {
        if(subPane) {
          if(self.Chat.rooms[roomJid]['pane-' + subPane]) {
            return self.Chat.rooms[roomJid]['pane-' + subPane];
          } else {
            self.Chat.rooms[roomJid]['pane-' + subPane] = $('#chat-room-' + self.Chat.rooms[roomJid].id).find(subPane);
            return self.Chat.rooms[roomJid]['pane-' + subPane];
          }
        } else {
          return $('#chat-room-' + self.Chat.rooms[roomJid].id);
        }
      }
    },

    /** Function: changeDataUserJidIfUserIsMe
     * Changes the room's data-userjid attribute if the specified user is the current user.
     *
     * Parameters:
     *   (String) roomId - Id of the room
     *   (Candy.Core.ChatUser) user - User
     */
    changeDataUserJidIfUserIsMe: function(roomId, user) {
      if (user.getNick() === Candy.Core.getUser().getNick()) {
        var roomElement = $('#chat-room-' + roomId);
        roomElement.attr('data-userjid', Strophe.getBareJidFromJid(roomElement.attr('data-userjid')) + '/' + user.getNick());
      }
    }
  };

  return self;
}(Candy.View.Pane || {}, jQuery));
