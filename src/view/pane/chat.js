/** File: chat.js
 * Candy - Chats are not dead yet.
 *
 * Legal: See the LICENSE file at the top-level directory of this distribution and at https://github.com/candy-chat/candy/blob/master/LICENSE
 */
'use strict';

/* global Candy, document, Mustache, Strophe, Audio, jQuery */

/** Class: Candy.View.Pane
 * Candy view pane handles everything regarding DOM updates etc.
 *
 * Parameters:
 *   (Candy.View.Pane) self - itself
 *   (jQuery) $ - jQuery
 */
Candy.View.Pane = (function(self, $) {

  /** Class: Candy.View.Pane.Chat
   * Chat-View related view updates
   */
  self.Chat = {
    /** Variable: rooms
     * Contains opened room elements
     */
    rooms: [],

    /** Function: addTab
     * Add a tab to the chat pane.
     *
     * Parameters:
     *   (String) roomJid - JID of room
     *   (String) roomName - Tab label
     *   (String) roomType - Type of room: `groupchat` or `chat`
     */
    addTab: function(roomJid, roomName, roomType) {
      var roomId = Candy.Util.jidToId(roomJid);

      var evtData = {
        roomJid: roomJid,
        roomName: roomName,
        roomType: roomType,
        roomId: roomId
      };

      /** Event: candy:view.pane.before-tab
       * Before sending a message
       *
       * Parameters:
       *   (String) roomJid - JID of the room the tab is for.
       *   (String) roomName - Name of the room.
       *   (String) roomType - What type of room: `groupchat` or `chat`
       *
       * Returns:
       *   Boolean|undefined - If you want to handle displaying the tab on your own, return false.
       */
      if ($(Candy).triggerHandler('candy:view.pane.before-tab', evtData) === false) {
        event.preventDefault();
        return;
      }

      var html = Mustache.to_html(Candy.View.Template.Chat.tab, {
          roomJid: roomJid,
          roomId: roomId,
          name: roomName || Strophe.getNodeFromJid(roomJid),
          privateUserChat: function() {return roomType === 'chat';},
          roomType: roomType
        }),
        tab = $(html).appendTo('#chat-tabs');

      tab.click(self.Chat.tabClick);
      // TODO: maybe we find a better way to get the close element.
      $('a.close', tab).click(self.Chat.tabClose);

      self.Chat.fitTabs();
    },

    /** Function: getTab
     * Get tab by JID.
     *
     * Parameters:
     *   (String) roomJid - JID of room
     *
     * Returns:
     *   (jQuery object) - Tab element
     */
    getTab: function(roomJid) {
      return $('#chat-tabs').children('li[data-roomjid="' + roomJid + '"]');
    },

    /** Function: removeTab
     * Remove tab element.
     *
     * Parameters:
     *   (String) roomJid - JID of room
     */
    removeTab: function(roomJid) {
      self.Chat.getTab(roomJid).remove();
      self.Chat.fitTabs();
    },

    /** Function: setActiveTab
     * Set the active tab.
     *
     * Add CSS classname `active` to the choosen tab and remove `active` from all other.
     *
     * Parameters:
     *   (String) roomJid - JID of room
     */
    setActiveTab: function(roomJid) {
      $('#chat-tabs').children().each(function() {
        var tab = $(this);
        if(tab.attr('data-roomjid') === roomJid) {
          tab.addClass('active');
        } else {
          tab.removeClass('active');
        }
      });
    },

    /** Function: increaseUnreadMessages
     * Increase unread message count in a tab by one.
     *
     * Parameters:
     *   (String) roomJid - JID of room
     *
     * Uses:
     *   - <Window.increaseUnreadMessages>
     */
    increaseUnreadMessages: function(roomJid) {
      var unreadElem = this.getTab(roomJid).find('.unread');
      unreadElem.show().text(unreadElem.text() !== '' ? parseInt(unreadElem.text(), 10) + 1 : 1);
      // only increase window unread messages in private chats
      if (self.Chat.rooms[roomJid].type === 'chat' || Candy.View.getOptions().updateWindowOnAllMessages === true) {
        self.Window.increaseUnreadMessages();
      }
    },

    /** Function: clearUnreadMessages
     * Clear unread message count in a tab.
     *
     * Parameters:
     *   (String) roomJid - JID of room
     *
     * Uses:
     *   - <Window.reduceUnreadMessages>
     */
    clearUnreadMessages: function(roomJid) {
      var unreadElem = self.Chat.getTab(roomJid).find('.unread');
      self.Window.reduceUnreadMessages(unreadElem.text());
      unreadElem.hide().text('');
    },

    /** Function: tabClick
     * Tab click event: show the room associated with the tab and stops the event from doing the default.
     */
    tabClick: function(e) {
      // remember scroll position of current room
      var currentRoomJid = Candy.View.getCurrent().roomJid;
      var roomPane = self.Room.getPane(currentRoomJid, '.message-pane');
      if (roomPane) {
        self.Chat.rooms[currentRoomJid].scrollPosition = roomPane.scrollTop();
      }

      self.Room.show($(this).attr('data-roomjid'));
      e.preventDefault();
    },

    /** Function: tabClose
     * Tab close (click) event: Leave the room (groupchat) or simply close the tab (chat).
     *
     * Parameters:
     *   (DOMEvent) e - Event triggered
     *
     * Returns:
     *   (Boolean) - false, this will stop the event from bubbling
     */
    tabClose: function() {
      var roomJid = $(this).parent().attr('data-roomjid');
      // close private user tab
      if(self.Chat.rooms[roomJid].type === 'chat') {
        self.Room.close(roomJid);
      // close multi-user room tab
      } else {
        Candy.Core.Action.Jabber.Room.Leave(roomJid);
      }
      return false;
    },

    /** Function: allTabsClosed
     * All tabs closed event: Disconnect from service. Hide sound control.
     *
     * TODO: Handle window close
     *
     * Returns:
     *   (Boolean) - false, this will stop the event from bubbling
     */
    allTabsClosed: function() {
      if (Candy.Core.getOptions().disconnectWithoutTabs) {
        Candy.Core.disconnect();
        self.Chat.Toolbar.hide();
        self.Chat.hideMobileIcon();
        return;
      }
    },

    /** Function: fitTabs
     * Fit tab size according to window size
     */
    fitTabs: function() {
      var availableWidth = $('#chat-tabs').innerWidth(),
        tabsWidth = 0,
        tabs = $('#chat-tabs').children();
      tabs.each(function() {
        tabsWidth += $(this).css({width: 'auto', overflow: 'visible'}).outerWidth(true);
      });
      if(tabsWidth > availableWidth) {
        // tabs.[outer]Width() measures the first element in `tabs`. It's no very readable but nearly two times faster than using :first
        var tabDiffToRealWidth = tabs.outerWidth(true) - tabs.width(),
          tabWidth = Math.floor((availableWidth) / tabs.length) - tabDiffToRealWidth;
        tabs.css({width: tabWidth, overflow: 'hidden'});
      }
    },

    /** Function: hideMobileIcon
     * Hide mobile roster pane icon.
     */
    hideMobileIcon: function() {
      $('#mobile-roster-icon').hide();
    },

    /** Function: showMobileIcon
     * Show mobile roster pane icon.
     */
    showMobileIcon: function() {
      $('#mobile-roster-icon').show();
    },

    /** Function: clickMobileIcon
     * Add class to 'open' roster pane (on mobile).
     */
    clickMobileIcon: function(e) {
      if ($('.room-pane').is('.open')) {
        $('.room-pane').removeClass('open');
      } else {
        $('.room-pane').addClass('open');
      }
      e.preventDefault();
    },

    /** Function: adminMessage
     * Display admin message
     *
     * Parameters:
     *   (String) subject - Admin message subject
     *   (String) message - Message to be displayed
     *
     * Triggers:
     *   candy:view.chat.admin-message using {subject, message}
     */
    adminMessage: function(subject, message) {
      if(Candy.View.getCurrent().roomJid) { // Simply dismiss admin message if no room joined so far. TODO: maybe we should show those messages on a dedicated pane?
        message = Candy.Util.Parser.all(message.substring(0, Candy.View.getOptions().crop.message.body));
        if(Candy.View.getOptions().enableXHTML === true) {
          message = Candy.Util.parseAndCropXhtml(message, Candy.View.getOptions().crop.message.body);
        }
        var timestamp = new Date();
        var html = Mustache.to_html(Candy.View.Template.Chat.adminMessage, {
          subject: subject,
          message: message,
          sender: $.i18n._('administratorMessageSubject'),
          time: Candy.Util.localizedTime(timestamp),
          timestamp: timestamp.toISOString()
        });
        $('#chat-rooms').children().each(function() {
          self.Room.appendToMessagePane($(this).attr('data-roomjid'), html);
        });
        self.Room.scrollToBottom(Candy.View.getCurrent().roomJid);

        /** Event: candy:view.chat.admin-message
         * After admin message display
         *
         * Parameters:
         *   (String) presetJid - Preset user JID
         */
        $(Candy).triggerHandler('candy:view.chat.admin-message', {
          'subject' : subject,
          'message' : message
        });
      }
    },

    /** Function: infoMessage
     * Display info message. This is a wrapper for <onInfoMessage> to be able to disable certain info messages.
     *
     * Parameters:
     *   (String) roomJid - Room JID
     *   (String) subject - Subject
     *   (String) message - Message
     */
    infoMessage: function(roomJid, subject, message) {
      self.Chat.onInfoMessage(roomJid, subject, message);
    },

    /** Function: onInfoMessage
     * Display info message. Used by <infoMessage> and several other functions which do not wish that their info message
     * can be disabled (such as kick/ban message or leave/join message in private chats).
     *
     * Parameters:
     *   (String) roomJid - Room JID
     *   (String) subject - Subject
     *   (String) message - Message
     */
    onInfoMessage: function(roomJid, subject, message) {
      message = message || '';
      if(Candy.View.getCurrent().roomJid && self.Chat.rooms[roomJid]) { // Simply dismiss info message if no room joined so far. TODO: maybe we should show those messages on a dedicated pane?
        if(Candy.View.getOptions().enableXHTML === true && message.length > 0) {
          message = Candy.Util.parseAndCropXhtml(message, Candy.View.getOptions().crop.message.body);
        } else {
          message = Candy.Util.Parser.all(message.substring(0, Candy.View.getOptions().crop.message.body));
        }
        var timestamp = new Date();
        var html = Mustache.to_html(Candy.View.Template.Chat.infoMessage, {
          subject: subject,
          message: $.i18n._(message),
          time: Candy.Util.localizedTime(timestamp),
          timestamp: timestamp.toISOString()
        });
        self.Room.appendToMessagePane(roomJid, html);
        if (Candy.View.getCurrent().roomJid === roomJid) {
          self.Room.scrollToBottom(Candy.View.getCurrent().roomJid);
        }
      }
    },

    /** Class: Candy.View.Pane.Toolbar
     * Chat toolbar for things like emoticons toolbar, room management etc.
     */
    Toolbar: {
      _supportsNativeAudio: null,

      /** Function: init
       * Register handler and enable or disable sound and status messages.
       */
      init: function() {
        $('#emoticons-icon').click(function(e) {
        self.Chat.Context.showEmoticonsMenu(e.currentTarget);
          e.stopPropagation();
        });
        $('#chat-autoscroll-control').click(self.Chat.Toolbar.onAutoscrollControlClick);
        try {
          if( !!document.createElement('audio').canPlayType ) {
            var a = document.createElement('audio');
            if( !!(a.canPlayType('audio/mpeg;').replace(/no/, '')) ) {
              self.Chat.Toolbar._supportsNativeAudio = "mp3";
            }
            else if( !!(a.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, '')) ) {
              self.Chat.Toolbar._supportsNativeAudio = "ogg";
            }
            else if ( !!(a.canPlayType('audio/mp4; codecs="mp4a.40.2"').replace(/no/, '')) ) {
              self.Chat.Toolbar._supportsNativeAudio = "m4a";
            }
          }
        } catch(e){ }
        $('#chat-sound-control').click(self.Chat.Toolbar.onSoundControlClick);
        if(Candy.Util.cookieExists('candy-nosound')) {
          $('#chat-sound-control').click();
        }
        $('#chat-statusmessage-control').click(self.Chat.Toolbar.onStatusMessageControlClick);
        if(Candy.Util.cookieExists('candy-nostatusmessages')) {
          $('#chat-statusmessage-control').click();
        }
        $('.box-shadow-icon').click(self.Chat.clickMobileIcon);
      },

      /** Function: show
       * Show toolbar.
       */
      show: function() {
        $('#chat-toolbar').show();
      },

      /** Function: hide
       * Hide toolbar.
       */
      hide: function() {
        $('#chat-toolbar').hide();
      },

      /* Function: update
       * Update toolbar for specific room
       */
      update: function(roomJid) {
        var context = $('#chat-toolbar').find('.context'),
          me = self.Room.getUser(roomJid);
        if(!me || !me.isModerator()) {
          context.hide();
        } else {
          context.show().click(function(e) {
            self.Chat.Context.show(e.currentTarget, roomJid);
            e.stopPropagation();
          });
        }
        self.Chat.Toolbar.updateUsercount(self.Chat.rooms[roomJid].usercount);
      },

      /** Function: playSound
       * Play sound (default method).
       */
      playSound: function() {
        self.Chat.Toolbar.onPlaySound();
      },

      /** Function: onPlaySound
       * Sound play event handler. Uses native (HTML5) audio if supported,
       * otherwise it will attempt to use bgsound with autostart.
       *
       * Don't call this method directly. Call `playSound()` instead.
       * `playSound()` will only call this method if sound is enabled.
       */
      onPlaySound: function() {
        try {
          if(self.Chat.Toolbar._supportsNativeAudio !== null) {
            new Audio(Candy.View.getOptions().assets + 'notify.' + self.Chat.Toolbar._supportsNativeAudio).play();
          } else {
            $('#chat-sound-control bgsound').remove();
            $('<bgsound/>').attr({ src: Candy.View.getOptions().assets + 'notify.mp3', loop: 1, autostart: true }).appendTo("#chat-sound-control");
          }
        } catch (e) {}
      },

      /** Function: onSoundControlClick
       * Sound control click event handler.
       *
       * Toggle sound (overwrite `playSound()`) and handle cookies.
       */
      onSoundControlClick: function() {
        var control = $('#chat-sound-control');
        if(control.hasClass('checked')) {
          self.Chat.Toolbar.playSound = function() {};
          Candy.Util.setCookie('candy-nosound', '1', 365);
        } else {
          self.Chat.Toolbar.playSound = function() {
            self.Chat.Toolbar.onPlaySound();
          };
          Candy.Util.deleteCookie('candy-nosound');
        }
        control.toggleClass('checked');
      },

      /** Function: onAutoscrollControlClick
       * Autoscroll control event handler.
       *
       * Toggle autoscroll
       */
      onAutoscrollControlClick: function() {
        var control = $('#chat-autoscroll-control');
        if(control.hasClass('checked')) {
          self.Room.scrollToBottom = function(roomJid) {
            self.Room.onScrollToStoredPosition(roomJid);
          };
          self.Window.autoscroll = false;
        } else {
          self.Room.scrollToBottom = function(roomJid) {
            self.Room.onScrollToBottom(roomJid);
          };
          self.Room.scrollToBottom(Candy.View.getCurrent().roomJid);
          self.Window.autoscroll = true;
        }
        control.toggleClass('checked');
      },

      /** Function: onStatusMessageControlClick
       * Status message control event handler.
       *
       * Toggle status message
       */
      onStatusMessageControlClick: function() {
        var control = $('#chat-statusmessage-control');
        if(control.hasClass('checked')) {
          self.Chat.infoMessage = function() {};
          Candy.Util.setCookie('candy-nostatusmessages', '1', 365);
        } else {
          self.Chat.infoMessage = function(roomJid, subject, message) {
            self.Chat.onInfoMessage(roomJid, subject, message);
          };
          Candy.Util.deleteCookie('candy-nostatusmessages');
        }
        control.toggleClass('checked');
      },

      /** Function: updateUserCount
       * Update usercount element with count.
       *
       * Parameters:
       *   (Integer) count - Current usercount
       */
      updateUsercount: function(count) {
        $('#chat-usercount').text(count);
      }
    },

    /** Class: Candy.View.Pane.Modal
     * Modal window
     */
    Modal: {
      /** Function: show
       * Display modal window
       *
       * Parameters:
       *   (String) html - HTML code to put into the modal window
       *   (Boolean) showCloseControl - set to true if a close button should be displayed [default false]
       *   (Boolean) showSpinner - set to true if a loading spinner should be shown [default false]
       *   (String) modalClass - custom class (or space-separate classes) to attach to the modal
       */
      show: function(html, showCloseControl, showSpinner, modalClass) {
        if(showCloseControl) {
          self.Chat.Modal.showCloseControl();
        } else {
          self.Chat.Modal.hideCloseControl();
        }
        if(showSpinner) {
          self.Chat.Modal.showSpinner();
        } else {
          self.Chat.Modal.hideSpinner();
        }
        // Reset classes to 'modal-common' only in case .show() is called
        // with different arguments before .hide() can remove the last applied
        // custom class
        $('#chat-modal').removeClass().addClass('modal-common');
        if( modalClass ) {
          $('#chat-modal').addClass(modalClass);
        }
        $('#chat-modal').stop(false, true);
        $('#chat-modal-body').html(html);
        $('#chat-modal').fadeIn('fast');
        $('#chat-modal-overlay').show();
      },

      /** Function: hide
       * Hide modal window
       *
       * Parameters:
       *   (Function) callback - Calls the specified function after modal window has been hidden.
       */
      hide: function(callback) {
        // Reset classes to include only `modal-common`.
        $('#chat-modal').removeClass().addClass('modal-common');
        $('#chat-modal').fadeOut('fast', function() {
          $('#chat-modal-body').text('');
          $('#chat-modal-overlay').hide();
        });
        // restore initial esc handling
        $(document).keydown(function(e) {
          if(e.which === 27) {
            e.preventDefault();
          }
        });
        if (callback) {
          callback();
        }
      },

      /** Function: showSpinner
       * Show loading spinner
       */
      showSpinner: function() {
        $('#chat-modal-spinner').show();
      },

      /** Function: hideSpinner
       * Hide loading spinner
       */
      hideSpinner: function() {
        $('#chat-modal-spinner').hide();
      },

      /** Function: showCloseControl
       * Show a close button
       */
      showCloseControl: function() {
        $('#admin-message-cancel').show().click(function(e) {
          self.Chat.Modal.hide();
          // some strange behaviour on IE7 (and maybe other browsers) triggers onWindowUnload when clicking on the close button.
          // prevent this.
          e.preventDefault();
        });

        // enable esc to close modal
        $(document).keydown(function(e) {
          if(e.which === 27) {
            self.Chat.Modal.hide();
            e.preventDefault();
          }
        });
      },

      /** Function: hideCloseControl
       * Hide the close button
       */
      hideCloseControl: function() {
        $('#admin-message-cancel').hide().click(function() {});
      },

      /** Function: showLoginForm
       * Show the login form modal
       *
       * Parameters:
       *  (String) message - optional message to display above the form
       *  (String) presetJid - optional user jid. if set, the user will only be prompted for password.
       */
      showLoginForm: function(message, presetJid) {
        var domains = Candy.Core.getOptions().domains;
        var hideDomainList = Candy.Core.getOptions().hideDomainList;
        domains = domains ? domains.map( function(d) {return {'domain':d};} )
                           : null;
        var customClass = domains && !hideDomainList ? 'login-with-domains'
                                                     : null;
        self.Chat.Modal.show((message ? message : '') + Mustache.to_html(Candy.View.Template.Login.form, {
          _labelNickname: $.i18n._('labelNickname'),
          _labelUsername: $.i18n._('labelUsername'),
          domains: domains,
          _labelPassword: $.i18n._('labelPassword'),
          _loginSubmit: $.i18n._('loginSubmit'),
          displayPassword: !Candy.Core.isAnonymousConnection(),
          displayUsername: !presetJid,
          displayDomain: domains ? true : false,
          displayNickname: Candy.Core.isAnonymousConnection(),
          presetJid: presetJid ? presetJid : false
        }), null, null, customClass);
        if(hideDomainList) {
          $('#domain').hide();
          $('.at-symbol').hide();
        }
        $('#login-form').children(':input:first').focus();

        // register submit handler
        $('#login-form').submit(function() {
          var username = $('#username').val(),
            password = $('#password').val(),
            domain = $('#domain');
          domain = domain.length ? domain.val().split(' ')[0] : null;

          if (!Candy.Core.isAnonymousConnection()) {
            var jid;
            if(domain) { // domain is stipulated
              // Ensure there is no domain part in username
              username = username.split('@')[0];
              jid = username + '@' + domain;
            } else {  // domain not stipulated
              // guess the input and create a jid out of it
              jid = Candy.Core.getUser() && username.indexOf("@") < 0 ?
              username + '@' + Strophe.getDomainFromJid(Candy.Core.getUser().getJid()) : username;
            }

            if(jid.indexOf("@") < 0 && !Candy.Core.getUser()) {
              Candy.View.Pane.Chat.Modal.showLoginForm($.i18n._('loginInvalid'));
            } else {
              //Candy.View.Pane.Chat.Modal.hide();
              Candy.Core.connect(jid, password);
            }
          } else { // anonymous login
            Candy.Core.connect(presetJid, null, username);
          }
          return false;
        });
      },

      /** Function: showEnterPasswordForm
       * Shows a form for entering room password
       *
       * Parameters:
       *   (String) roomJid - Room jid to join
       *   (String) roomName - Room name
       *   (String) message - [optional] Message to show as the label
       */
      showEnterPasswordForm: function(roomJid, roomName, message) {
        self.Chat.Modal.show(Mustache.to_html(Candy.View.Template.PresenceError.enterPasswordForm, {
          roomName: roomName,
          _labelPassword: $.i18n._('labelPassword'),
          _label: (message ? message : $.i18n._('enterRoomPassword', [roomName])),
          _joinSubmit: $.i18n._('enterRoomPasswordSubmit')
        }), true);
        $('#password').focus();

        // register submit handler
        $('#enter-password-form').submit(function() {
          var password = $('#password').val();

          self.Chat.Modal.hide(function() {
            Candy.Core.Action.Jabber.Room.Join(roomJid, password);
          });
          return false;
        });
      },

      /** Function: showNicknameConflictForm
       * Shows a form indicating that the nickname is already taken and
       * for chosing a new nickname
       *
       * Parameters:
       *   (String) roomJid - Room jid to join
       */
      showNicknameConflictForm: function(roomJid) {
        self.Chat.Modal.show(Mustache.to_html(Candy.View.Template.PresenceError.nicknameConflictForm, {
          _labelNickname: $.i18n._('labelNickname'),
          _label: $.i18n._('nicknameConflict'),
          _loginSubmit: $.i18n._('loginSubmit')
        }));
        $('#nickname').focus();

        // register submit handler
        $('#nickname-conflict-form').submit(function() {
          var nickname = $('#nickname').val();

          self.Chat.Modal.hide(function() {
            Candy.Core.getUser().data.nick = nickname;
            Candy.Core.Action.Jabber.Room.Join(roomJid);
          });
          return false;
        });
      },

      /** Function: showError
       * Show modal containing error message
       *
       * Parameters:
       *   (String) message - key of translation to display
       *   (Array) replacements - array containing replacements for translation (%s)
       */
      showError: function(message, replacements) {
        self.Chat.Modal.show(Mustache.to_html(Candy.View.Template.PresenceError.displayError, {
          _error: $.i18n._(message, replacements)
        }), true);
      }
    },

    /** Class: Candy.View.Pane.Tooltip
     * Class to display tooltips over specific elements
     */
    Tooltip: {
      /** Function: show
       * Show a tooltip on event.currentTarget with content specified or content within the target's attribute data-tooltip.
       *
       * On mouseleave on the target, hide the tooltip.
       *
       * Parameters:
       *   (Event) event - Triggered event
       *   (String) content - Content to display [optional]
       */
      show: function(event, content) {
        var tooltip = $('#tooltip'),
          target = $(event.currentTarget);

        if(!content) {
          content = target.attr('data-tooltip');
        }

        if(tooltip.length === 0) {
          var html = Mustache.to_html(Candy.View.Template.Chat.tooltip);
          $('#chat-pane').append(html);
          tooltip = $('#tooltip');
        }

        $('#context-menu').hide();

        tooltip.stop(false, true);
        tooltip.children('div').html(content);

        var pos = target.offset(),
            posLeft = Candy.Util.getPosLeftAccordingToWindowBounds(tooltip, pos.left),
            posTop  = Candy.Util.getPosTopAccordingToWindowBounds(tooltip, pos.top);

        tooltip
          .css({'left': posLeft.px, 'top': posTop.px})
          .removeClass('left-top left-bottom right-top right-bottom')
          .addClass(posLeft.backgroundPositionAlignment + '-' + posTop.backgroundPositionAlignment)
          .fadeIn('fast');

        target.mouseleave(function(event) {
          event.stopPropagation();
          $('#tooltip').stop(false, true).fadeOut('fast', function() {$(this).css({'top': 0, 'left': 0});});
        });
      }
    },

    /** Class: Candy.View.Pane.Context
     * Context menu for actions and settings
     */
    Context: {
      /** Function: init
       * Initialize context menu and setup mouseleave handler.
       */
      init: function() {
        if ($('#context-menu').length === 0) {
          var html = Mustache.to_html(Candy.View.Template.Chat.Context.menu);
          $('#chat-pane').append(html);
          $('#context-menu').mouseleave(function() {
            $(this).fadeOut('fast');
          });
        }
      },

      /** Function: show
       * Show context menu (positions it according to the window height/width)
       *
       * Parameters:
       *   (Element) elem - On which element it should be shown
       *   (String) roomJid - Room Jid of the room it should be shown
       *   (Candy.Core.chatUser) user - User
       *
       * Uses:
       *   <getMenuLinks> for getting menulinks the user has access to
       *   <Candy.Util.getPosLeftAccordingToWindowBounds> for positioning
       *   <Candy.Util.getPosTopAccordingToWindowBounds> for positioning
       *
       * Triggers:
       *   candy:view.roster.after-context-menu using {roomJid, user, elements}
       */
      show: function(elem, roomJid, user) {
        elem = $(elem);
        var roomId = self.Chat.rooms[roomJid].id,
          menu = $('#context-menu'),
          links = $('ul li', menu);

        $('#tooltip').hide();

        // add specific context-user class if a user is available (when context menu should be opened next to a user)
        if(!user) {
          user = Candy.Core.getUser();
        }

        links.remove();

        var menulinks = this.getMenuLinks(roomJid, user, elem),
          id,
          clickHandler = function(roomJid, user) {
            return function(event) {
              event.data.callback(event, roomJid, user);
              $('#context-menu').hide();
            };
          };

        for(id in menulinks) {
          if(menulinks.hasOwnProperty(id)) {
            var link = menulinks[id],
              html = Mustache.to_html(Candy.View.Template.Chat.Context.menulinks, {
                'roomId'   : roomId,
                'class'    : link['class'],
                'id'       : id,
                'label'    : link.label
              });
            $('ul', menu).append(html);
            $('#context-menu-' + id).bind('click', link, clickHandler(roomJid, user));
          }
        }
        // if `id` is set the menu is not empty
        if(id) {
          var pos = elem.offset(),
            posLeft = Candy.Util.getPosLeftAccordingToWindowBounds(menu, pos.left),
            posTop  = Candy.Util.getPosTopAccordingToWindowBounds(menu, pos.top);

          menu
            .css({'left': posLeft.px, 'top': posTop.px})
            .removeClass('left-top left-bottom right-top right-bottom')
            .addClass(posLeft.backgroundPositionAlignment + '-' + posTop.backgroundPositionAlignment)
            .fadeIn('fast');

          /** Event: candy:view.roster.after-context-menu
           * After context menu display
           *
           * Parameters:
           *   (String) roomJid - room where the context menu has been triggered
           *   (Candy.Core.ChatUser) user - User
           *   (jQuery.Element) element - Menu element
           */
          $(Candy).triggerHandler('candy:view.roster.after-context-menu', {
            'roomJid' : roomJid,
            'user' : user,
            'element': menu
          });

          return true;
        }
      },

      /** Function: getMenuLinks
       * Extends <initialMenuLinks> with menu links gathered from candy:view.roster.contextmenu
       *
       * Parameters:
       *   (String) roomJid - Room in which the menu will be displayed
       *   (Candy.Core.ChatUser) user - User
       *   (jQuery.Element) elem - Parent element of the context menu
       *
       * Triggers:
       *   candy:view.roster.context-menu using {roomJid, user, elem}
       *
       * Returns:
       *   (Object) - object containing the extended menulinks.
       */
      getMenuLinks: function(roomJid, user, elem) {
        var menulinks, id;

        var evtData = {
          'roomJid' : roomJid,
          'user' : user,
          'elem': elem,
          'menulinks': this.initialMenuLinks(elem)
        };

        /** Event: candy:view.roster.context-menu
         * Modify existing menu links (add links)
         *
         * In order to modify the links you need to change the object passed with an additional
         * key "menulinks" containing the menulink object.
         *
         * Parameters:
         *   (String) roomJid - Room on which the menu should be displayed
         *   (Candy.Core.ChatUser) user - User
         *   (jQuery.Element) elem - Parent element of the context menu
         */
        $(Candy).triggerHandler('candy:view.roster.context-menu', evtData);

        menulinks = evtData.menulinks;

        for(id in menulinks) {
          if(menulinks.hasOwnProperty(id) && menulinks[id].requiredPermission !== undefined && !menulinks[id].requiredPermission(user, self.Room.getUser(roomJid), elem)) {
            delete menulinks[id];
          }
        }
        return menulinks;
      },

      /** Function: initialMenuLinks
       * Returns initial menulinks. The following are initial:
       *
       * - Private Chat
       * - Ignore
       * - Unignore
       * - Kick
       * - Ban
       * - Change Subject
       *
       * Returns:
       *   (Object) - object containing those menulinks
       */
      initialMenuLinks: function() {
        return {
          'private': {
            requiredPermission: function(user, me) {
              return me.getNick() !== user.getNick() && Candy.Core.getRoom(Candy.View.getCurrent().roomJid) && !Candy.Core.getUser().isInPrivacyList('ignore', user.getJid());
            },
            'class' : 'private',
            'label' : $.i18n._('privateActionLabel'),
            'callback' : function(e, roomJid, user) {
              $('#user-' + Candy.Util.jidToId(roomJid) + '-' + Candy.Util.jidToId(user.getJid())).click();
            }
          },
          'ignore': {
            requiredPermission: function(user, me) {
              return me.getNick() !== user.getNick() && !Candy.Core.getUser().isInPrivacyList('ignore', user.getJid());
            },
            'class' : 'ignore',
            'label' : $.i18n._('ignoreActionLabel'),
            'callback' : function(e, roomJid, user) {
              Candy.View.Pane.Room.ignoreUser(roomJid, user.getJid());
            }
          },
          'unignore': {
            requiredPermission: function(user, me) {
              return me.getNick() !== user.getNick() && Candy.Core.getUser().isInPrivacyList('ignore', user.getJid());
            },
            'class' : 'unignore',
            'label' : $.i18n._('unignoreActionLabel'),
            'callback' : function(e, roomJid, user) {
              Candy.View.Pane.Room.unignoreUser(roomJid, user.getJid());
            }
          },
          'kick': {
            requiredPermission: function(user, me) {
              return me.getNick() !== user.getNick() && me.isModerator() && !user.isModerator();
            },
            'class' : 'kick',
            'label' : $.i18n._('kickActionLabel'),
            'callback' : function(e, roomJid, user) {
              self.Chat.Modal.show(Mustache.to_html(Candy.View.Template.Chat.Context.contextModalForm, {
                _label: $.i18n._('reason'),
                _submit: $.i18n._('kickActionLabel')
              }), true);
              $('#context-modal-field').focus();
              $('#context-modal-form').submit(function() {
                Candy.Core.Action.Jabber.Room.Admin.UserAction(roomJid, user.getJid(), 'kick', $('#context-modal-field').val());
                self.Chat.Modal.hide();
                return false; // stop propagation & preventDefault, as otherwise you get disconnected (wtf?)
              });
            }
          },
          'ban': {
            requiredPermission: function(user, me) {
              return me.getNick() !== user.getNick() && me.isModerator() && !user.isModerator();
            },
            'class' : 'ban',
            'label' : $.i18n._('banActionLabel'),
            'callback' : function(e, roomJid, user) {
              self.Chat.Modal.show(Mustache.to_html(Candy.View.Template.Chat.Context.contextModalForm, {
                _label: $.i18n._('reason'),
                _submit: $.i18n._('banActionLabel')
              }), true);
              $('#context-modal-field').focus();
              $('#context-modal-form').submit(function() {
                Candy.Core.Action.Jabber.Room.Admin.UserAction(roomJid, user.getJid(), 'ban', $('#context-modal-field').val());
                self.Chat.Modal.hide();
                return false; // stop propagation & preventDefault, as otherwise you get disconnected (wtf?)
              });
            }
          },
          'subject': {
            requiredPermission: function(user, me) {
              return me.getNick() === user.getNick() && me.isModerator();
            },
            'class': 'subject',
            'label' : $.i18n._('setSubjectActionLabel'),
            'callback': function(e, roomJid) {
              self.Chat.Modal.show(Mustache.to_html(Candy.View.Template.Chat.Context.contextModalForm, {
                _label: $.i18n._('subject'),
                _submit: $.i18n._('setSubjectActionLabel')
              }), true);
              $('#context-modal-field').focus();
              $('#context-modal-form').submit(function(e) {
                Candy.Core.Action.Jabber.Room.Admin.SetSubject(roomJid, $('#context-modal-field').val());
                self.Chat.Modal.hide();
                e.preventDefault();
              });
            }
          }
        };
      },

      /** Function: showEmoticonsMenu
       * Shows the special emoticons menu
       *
       * Parameters:
       *   (Element) elem - Element on which it should be positioned to.
       *
       * Returns:
       *   (Boolean) - true
       */
      showEmoticonsMenu: function(elem) {
        elem = $(elem);
        var pos = elem.offset(),
          menu = $('#context-menu'),
          content = $('ul', menu),
          emoticons = '',
          i;

        $('#tooltip').hide();

        for(i = Candy.Util.Parser.emoticons.length-1; i >= 0; i--) {
          emoticons = '<img src="' + Candy.Util.Parser._emoticonPath + Candy.Util.Parser.emoticons[i].image + '" alt="' + Candy.Util.Parser.emoticons[i].plain + '" />' + emoticons;
        }
        content.html('<li class="emoticons">' + emoticons + '</li>');
        content.find('img').click(function() {
          var input = Candy.View.Pane.Room.getPane(Candy.View.getCurrent().roomJid, '.message-form').children('.field'),
            value = input.val(),
            emoticon = $(this).attr('alt') + ' ';
          input.val(value ? value + ' ' + emoticon : emoticon).focus();

          // Once you make a selction, hide the menu.
          menu.hide();
        });

        var posLeft = Candy.Util.getPosLeftAccordingToWindowBounds(menu, pos.left),
          posTop  = Candy.Util.getPosTopAccordingToWindowBounds(menu, pos.top);

        menu
          .css({'left': posLeft.px, 'top': posTop.px})
          .removeClass('left-top left-bottom right-top right-bottom')
          .addClass(posLeft.backgroundPositionAlignment + '-' + posTop.backgroundPositionAlignment)
          .fadeIn('fast');

        return true;
      }
    }
  };

  return self;
}(Candy.View.Pane || {}, jQuery));
