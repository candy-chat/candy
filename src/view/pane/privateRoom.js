/** File: privateRoom.js
 * Candy - Chats are not dead yet.
 *
 * Legal: See the LICENSE file at the top-level directory of this distribution and at https://github.com/candy-chat/candy/blob/master/LICENSE
 */
'use strict';

/* global Candy, Strophe, jQuery */

/** Class: Candy.View.Pane
 * Candy view pane handles everything regarding DOM updates etc.
 *
 * Parameters:
 *   (Candy.View.Pane) self - itself
 *   (jQuery) $ - jQuery
 */
Candy.View.Pane = (function(self, $) {

  /** Class: Candy.View.Pane.PrivateRoom
   * Private room handling
   */
  self.PrivateRoom = {
    /** Function: open
     * Opens a new private room
     *
     * Parameters:
     *   (String) roomJid - Room jid to open
     *   (String) roomName - Room name
     *   (Boolean) switchToRoom - If true, displayed room switches automatically to this room
     *                            (e.g. when user clicks itself on another user to open a private chat)
     *   (Boolean) isNoConferenceRoomJid - true if a 3rd-party client sends a direct message to this user (not via the room)
     *                    then the username is the node and not the resource. This param addresses this case.
     *
     * Triggers:
     *   candy:view.private-room.after-open using {roomJid, type, element}
     */
    open: function(roomJid, roomName, switchToRoom, isNoConferenceRoomJid) {
      var user = isNoConferenceRoomJid ? Candy.Core.getUser() : self.Room.getUser(Strophe.getBareJidFromJid(roomJid)),
        evtData = {
          'roomJid': roomJid,
          'roomName': roomName,
          'type': 'chat',
        };

      /** Event: candy:view.private-room.before-open
       * Before opening a new private room
       *
       * Parameters:
       *   (String) roomJid - Room JID
       *   (String) roomName - Room name
       *   (String) type - 'chat'
       *
       * Returns:
       *   Boolean - if you don't want to open the private room, return false
       */
      if($(Candy).triggerHandler('candy:view.private-room.before-open', evtData) === false) {
        return false;
      }

      // if target user is in privacy list, don't open the private chat.
      if (Candy.Core.getUser().isInPrivacyList('ignore', roomJid)) {
        return false;
      }
      if(!self.Chat.rooms[roomJid]) {
        if(self.Room.init(roomJid, roomName, 'chat') === false) {
          return false;
        }
      }
      if(switchToRoom) {
        self.Room.show(roomJid);
      }

      self.Roster.update(roomJid, new Candy.Core.ChatUser(roomJid, roomName), 'join', user);
      self.Roster.update(roomJid, user, 'join', user);
      self.PrivateRoom.setStatus(roomJid, 'join');

      evtData.element = self.Room.getPane(roomJid);
      /** Event: candy:view.private-room.after-open
       * After opening a new private room
       *
       * Parameters:
       *   (String) roomJid - Room JID
       *   (String) type - 'chat'
       *   (jQuery.Element) element - User element
       */
      $(Candy).triggerHandler('candy:view.private-room.after-open', evtData);
    },

    /** Function: setStatus
     * Set offline or online status for private rooms (when one of the participants leaves the room)
     *
     * Parameters:
     *   (String) roomJid - Private room jid
     *   (String) status - "leave"/"join"
     */
    setStatus: function(roomJid, status) {
      var messageForm = self.Room.getPane(roomJid, '.message-form');
      if(status === 'join') {
        self.Chat.getTab(roomJid).addClass('online').removeClass('offline');

        messageForm.children('.field').removeAttr('disabled');
        messageForm.children('.submit').removeAttr('disabled');

        self.Chat.getTab(roomJid);
      } else if(status === 'leave') {
        self.Chat.getTab(roomJid).addClass('offline').removeClass('online');

        messageForm.children('.field').attr('disabled', true);
        messageForm.children('.submit').attr('disabled', true);
      }
    },

    /** Function: changeNick
     * Changes the nick for every private room opened with this roomJid.
     *
     * Parameters:
     *   (String) roomJid - Public room jid
     *   (Candy.Core.ChatUser) user - User which changes his nick
     */
    changeNick: function(roomJid, user) {
      Candy.Core.log('[View:Pane:PrivateRoom] changeNick');

      var previousPrivateRoomJid = roomJid + '/' + user.getPreviousNick(),
        newPrivateRoomJid = roomJid + '/' + user.getNick(),
        previousPrivateRoomId = Candy.Util.jidToId(previousPrivateRoomJid),
        newPrivateRoomId = Candy.Util.jidToId(newPrivateRoomJid),
        room = self.Chat.rooms[previousPrivateRoomJid],
        roomElement,
        roomTabElement;

      // it could happen that the new private room is already existing -> close it first.
      // if this is not done, errors appear as two rooms would have the same id
      if (self.Chat.rooms[newPrivateRoomJid]) {
        self.Room.close(newPrivateRoomJid);
      }

      if (room) { /* someone I talk with, changed nick */
        room.name = user.getNick();
        room.id   = newPrivateRoomId;

        self.Chat.rooms[newPrivateRoomJid] = room;
        delete self.Chat.rooms[previousPrivateRoomJid];

        roomElement = $('#chat-room-' + previousPrivateRoomId);
        if (roomElement) {
          roomElement.attr('data-roomjid', newPrivateRoomJid);
          roomElement.attr('id', 'chat-room-' + newPrivateRoomId);

          roomTabElement = $('#chat-tabs li[data-roomjid="' + previousPrivateRoomJid + '"]');
          roomTabElement.attr('data-roomjid', newPrivateRoomJid);

          /* TODO: The '@' is defined in the template. Somehow we should
           * extract both things into our CSS or do something else to prevent that.
           */
          roomTabElement.children('a.label').text('@' + user.getNick());

          if (Candy.View.getCurrent().roomJid === previousPrivateRoomJid) {
            Candy.View.getCurrent().roomJid = newPrivateRoomJid;
          }
        }
      } else { /* I changed the nick */
        roomElement = $('.room-pane.roomtype-chat[data-userjid="' + previousPrivateRoomJid + '"]');
        if (roomElement.length) {
          previousPrivateRoomId = Candy.Util.jidToId(roomElement.attr('data-roomjid'));
          roomElement.attr('data-userjid', newPrivateRoomJid);
        }
      }
      if (roomElement && roomElement.length) {
        self.Roster.changeNick(previousPrivateRoomId, user);
      }
    }
  };

  return self;
}(Candy.View.Pane || {}, jQuery));
