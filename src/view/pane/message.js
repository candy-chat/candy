/** File: message.js
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

/* global Candy, Mustache, jQuery */

/** Class: Candy.View.Pane
 * Candy view pane handles everything regarding DOM updates etc.
 *
 * Parameters:
 *   (Candy.View.Pane) self - itself
 *   (jQuery) $ - jQuery
 */
Candy.View.Pane = (function(self, $) {

  /** Class: Candy.View.Pane.Message
   * Message submit/show handling
   */
  self.Message = {
    /** Function: submit
     * on submit handler for message field sends the message to the server and if it's a private chat, shows the message
     * immediately because the server doesn't send back those message.
     *
     * Parameters:
     *   (Event) event - Triggered event
     *
     * Triggers:
     *   candy:view.message.before-send using {message}
     *
     * FIXME: as everywhere, `roomJid` might be slightly incorrect in this case
     *        - maybe rename this as part of a refactoring.
     */
    submit: function(event) {
      var roomJid = Candy.View.getCurrent().roomJid,
        room = Candy.View.Pane.Chat.rooms[roomJid],
        roomType = room.type,
        targetJid = room.targetJid,
        message = $(this).children('.field').val().substring(0, Candy.View.getOptions().crop.message.body),
        xhtmlMessage,
        evtData = {
          roomJid: roomJid,
          message: message,
          xhtmlMessage: xhtmlMessage
        };

      /** Event: candy:view.message.before-send
       * Before sending a message
       *
       * Parameters:
       *   (String) roomJid - room to which the message should be sent
       *   (String) message - Message text
       *   (String) xhtmlMessage - XHTML formatted message [default: undefined]
       *
       * Returns:
       *   Boolean|undefined - if you like to stop sending the message, return false.
       */
      if($(Candy).triggerHandler('candy:view.message.before-send', evtData) === false) {
        event.preventDefault();
        return;
      }

      message = evtData.message;
      xhtmlMessage = evtData.xhtmlMessage;

      Candy.Core.Action.Jabber.Room.Message(targetJid, message, roomType, xhtmlMessage);
      // Private user chat. Jabber won't notify the user who has sent the message. Just show it as the user hits the button...
      if(roomType === 'chat' && message) {
        self.Message.show(roomJid, self.Room.getUser(roomJid).getNick(), message, xhtmlMessage, undefined, Candy.Core.getUser().getJid());
      }
      // Clear input and set focus to it
      $(this).children('.field').val('').focus();
      event.preventDefault();
    },

    /** Function: show
     * Show a message in the message pane
     *
     * Parameters:
     *   (String) roomJid - room in which the message has been sent to
     *   (String) name - Name of the user which sent the message
     *   (String) message - Message
     *   (String) xhtmlMessage - XHTML formatted message [if options enableXHTML is true]
     *   (String) timestamp - [optional] Timestamp of the message, if not present, current date.
     *   (Boolean) carbon - [optional] Indication of wether or not the message was a carbon
     *
     * Triggers:
     *   candy:view.message.before-show using {roomJid, name, message}
     *   candy.view.message.before-render using {template, templateData}
     *   candy:view.message.after-show using {roomJid, name, message, element}
     */
    show: function(roomJid, name, message, xhtmlMessage, timestamp, from, carbon, stanza) {
      message = Candy.Util.Parser.all(message.substring(0, Candy.View.getOptions().crop.message.body));
      if(Candy.View.getOptions().enableXHTML === true && xhtmlMessage) {
        xhtmlMessage = Candy.Util.parseAndCropXhtml(xhtmlMessage, Candy.View.getOptions().crop.message.body);
      }

      timestamp = timestamp || new Date();

      // Assume we have an ISO-8601 date string and convert it to a Date object
      if (!timestamp.toDateString) {
        timestamp = Candy.Util.iso8601toDate(timestamp);
      }

      var messagePane = self.Room.getPane(roomJid, ".message-pane");
      var messageId;
      if (stanza) {
        messageId = $(stanza).attr('id');
        if (messageId) {
          var existingMessage = messagePane.find('[data-message-id="' + messageId + '"]');
          if (messageId && existingMessage.length > 0) {
            // This message ID has already been rendered
            return false;
          }
        }
      }

      // Before we add the new message, check to see if we should be automatically scrolling or not.
      var enableScroll = ((messagePane.scrollTop() + messagePane.outerHeight()) === messagePane.prop('scrollHeight')) || !$(messagePane).is(':visible');
      Candy.View.Pane.Chat.rooms[roomJid].enableScroll = enableScroll;

      var evtData = {
        'roomJid': roomJid,
        'name': name,
        'message': message,
        'xhtmlMessage': xhtmlMessage,
        'from': from,
        'stanza': stanza
      };

      /** Event: candy:view.message.before-show
       * Before showing a new message
       *
       * Parameters:
       *   (String) roomJid - Room JID
       *   (String) name - Name of the sending user
       *   (String) message - Message text
       *
       * Returns:
       *   Boolean - if you don't want to show the message, return false
       */
      if($(Candy).triggerHandler('candy:view.message.before-show', evtData) === false) {
        return;
      }

      message = evtData.message;
      xhtmlMessage = evtData.xhtmlMessage;
      if(xhtmlMessage !== undefined && xhtmlMessage.length > 0) {
        message = xhtmlMessage;
      }

      if(!message) {
        return;
      }

      var renderEvtData = {
        template: Candy.View.Template.Message.item,
        templateData: {
          name: name,
          displayName: Candy.Util.crop(name, Candy.View.getOptions().crop.message.nickname),
          message: message,
          time: Candy.Util.localizedTime(timestamp),
          timestamp: timestamp.toISOString(),
          roomjid: roomJid,
          from: from,
          id: messageId
        },
        stanza: stanza
      };

      /** Event: candy:view.message.before-render
       * Before rendering the message element
       *
       * Parameters:
       *   (String) template - Template to use
       *   (Object) templateData - Template data consists of:
       *                           - (String) name - Name of the sending user
       *                           - (String) displayName - Cropped name of the sending user
       *                           - (String) message - Message text
       *                           - (String) time - Localized time of message
       *                           - (String) timestamp - ISO formatted timestamp of message
       */
      $(Candy).triggerHandler('candy:view.message.before-render', renderEvtData);

      var html = Mustache.to_html(renderEvtData.template, renderEvtData.templateData);
      self.Room.appendToMessagePane(roomJid, html);
      var elem = self.Room.getPane(roomJid, '.message-pane').children().last();
      // click on username opens private chat
      elem.find('a.label').click(function(event) {
        event.preventDefault();
        // Check if user is online and not myself
        var room = Candy.Core.getRoom(roomJid);
        if(room && name !== self.Room.getUser(Candy.View.getCurrent().roomJid).getNick() && room.getRoster().get(roomJid + '/' + name)) {
          if(Candy.View.Pane.PrivateRoom.open(roomJid + '/' + name, name, true) === false) {
            return false;
          }
        }
      });

      if (!carbon) {
        var notifyEvtData = {
          name: name,
          displayName: Candy.Util.crop(name, Candy.View.getOptions().crop.message.nickname),
          roomJid: roomJid,
          message: message,
          time: Candy.Util.localizedTime(timestamp),
          timestamp: timestamp.toISOString()
        };
        /** Event: candy:view.message.notify
         * Notify the user (optionally) that a new message has been received
         *
         * Parameters:
         *   (Object) templateData - Template data consists of:
         *                           - (String) name - Name of the sending user
         *                           - (String) displayName - Cropped name of the sending user
         *                           - (String) roomJid - JID into which the message was sent
         *                           - (String) message - Message text
         *                           - (String) time - Localized time of message
         *                           - (String) timestamp - ISO formatted timestamp of message
         *                           - (Boolean) carbon - Indication of wether or not the message was a carbon
         */
        $(Candy).triggerHandler('candy:view.message.notify', notifyEvtData);

        // Check to see if in-core notifications are disabled
        if(!Candy.Core.getOptions().disableCoreNotifications) {
          if(Candy.View.getCurrent().roomJid !== roomJid || !self.Window.hasFocus()) {
            self.Chat.increaseUnreadMessages(roomJid);
            if(!self.Window.hasFocus()) {
              // Notify the user about a new private message OR on all messages if configured
              if(Candy.View.Pane.Chat.rooms[roomJid].type === 'chat' || Candy.View.getOptions().updateWindowOnAllMessages === true) {
                self.Chat.Toolbar.playSound();
              }
            }
          }
        }

        if(Candy.View.getCurrent().roomJid === roomJid) {
          self.Room.scrollToBottom(roomJid);
        }
      }

      evtData.element = elem;

      /** Event: candy:view.message.after-show
       * Triggered after showing a message
       *
       * Parameters:
       *   (String) roomJid - Room JID
       *   (jQuery.Element) element - User element
       *   (String) name - Name of the sending user
       *   (String) message - Message text
       */
      $(Candy).triggerHandler('candy:view.message.after-show', evtData);

      return true;
    }
  };

  return self;
}(Candy.View.Pane || {}, jQuery));
