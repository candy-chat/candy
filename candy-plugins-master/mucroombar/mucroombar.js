/** File: mucroombar.js
 * Candy Plugin Auto-Join Incoming MUC Invites
 * Author: Melissa Adamaitis <madamei@mojolingo.com>
 * Dependency: CandyShop.StaticLobby
 */

var CandyShop = (function(self) { return self; }(CandyShop || {}));

CandyShop.RoomBar = (function(self, Candy, $) {
  /** Object: about
   *
   * Contains:
   *  (String) name - Candy Plugin Add MUC Management Bar
   *  (Float) version - Candy Plugin Add MUC Management Bar
   */
  self.about = {
    name: 'Candy Plugin Add MUC Management Bar',
    version: '1.0'
  };

  /**
   * Initializes the RoomBar plugin with the default settings.
   */
  self.init = function() {
    // Add a room bar when the room is first created.
    $(Candy).on('candy:view.room.after-show', function(ev, obj) {
      CandyShop.RoomBar.addRoomBar(obj);
      CandyShop.RoomBar.appendInviteUsersButton(obj.roomJid);
      return undefined;
    });

    // Change the topic in the roombar when it is changed.
    $(Candy).on('candy:view.room.after-subject-change', function(ev, obj) {
      CandyShop.RoomBar.showTopic(obj.subject, obj.element);
    });

    // Remove the now-useless "Change Subject" menu item
    $(Candy).on('candy:view.roster.context-menu', function (ev, obj) {
      delete obj.menulinks.subject;
    });
  };

  self.addRoomBar = function(obj){
    if($('div.room-pane.roomtype-groupchat[data-roomjid="' + obj.roomJid + '"] .message-pane-wrapper .roombar').length === 0) {
      var roombarHtml = self.Template.roombar;
      $('div.room-pane.roomtype-groupchat[data-roomjid="' + obj.roomJid + '"] .message-pane-wrapper').prepend(roombarHtml);
    }
    $('#' + obj.element.context.id + ' .message-pane-wrapper .roombar .topic').click(function() {
      self.updateRoomTopic(obj.roomJid, obj.element.context.id, $(this).html());
    });
  };

  self.showTopic = function(topic, element) {
    $(element).find(' .message-pane-wrapper .roombar .topic').html(topic);
  };

  self.updateRoomTopic = function(roomJid, elementId, currentTopic) {
    // If we're a room moderator, be able to edit the room topic.
    if(Candy.Core.getRoom(roomJid) !== null && Candy.Core.getRoom(roomJid).user !== null && Candy.Core.getRoom(roomJid).user.getRole() === 'moderator') {
      // If there isn't an active input for room topic already, create input interface.
      if($('#' + elementId + ' .message-pane-wrapper .roombar .topic input').length === 0) {
        // Replace topic with an input field
        if(currentTopic === ' ') { currentTopic = ''; }
        var fieldHtml = '<input type="text" value="' + currentTopic + '" />';
        $('#' + elementId + ' .message-pane-wrapper .roombar .topic').html(fieldHtml);
        // Add focus to the new element.
        $('#' + elementId + ' .message-pane-wrapper .roombar .topic input').focus();
        // Set listener for on return press or lose focus.
        $('#' + elementId + ' .message-pane-wrapper .roombar .topic input').blur(function() {
          if(currentTopic !== $(this).val()) {
            CandyShop.RoomBar.sendNewTopic(roomJid, $(this).val());
          } else {
            $('#' + elementId + ' .message-pane-wrapper .roombar .topic').html(currentTopic);
          }
        });
        $('#' + elementId + ' .message-pane-wrapper .roombar .topic input').keypress(function(ev) {
          var keycode = (ev.keyCode ? ev.keyCode : ev.which);
          if(keycode === 13) {
            if(currentTopic !== $(this).val()) {
              CandyShop.RoomBar.sendNewTopic(roomJid, $(this).val());
            } else {
              $('#' + elementId + ' .message-pane-wrapper .roombar .topic').html(currentTopic);
            }
          }
        });
      }
    }
  };

  self.appendInviteUsersButton = function(roomJid) {
    var paneHeading = $('#chat-rooms > div.roomtype-groupchat[data-roomjid="' + roomJid + '"] .roster-wrapper .pane-heading');
    if ($(paneHeading).find('.invite-users').length === 0) {
      var html = self.Template.inviteButton;
      $(paneHeading).append(html);
      $(paneHeading).find('.invite-users').click(function() {
        // Pop up a modal with an invite-users dialogue.
        Candy.View.Pane.Chat.Modal.show(Mustache.to_html(self.Template.inviteModal, {
          roomjid: roomJid
        }), true, false);

        self.centerModal(true);

        // Bloodhound suggestion engine
        var bhUsers = new Bloodhound({
          name: 'users',
          local: $.map(Candy.Core.getRoster().items, function(item) {
              return { name: item.getName(), jid: item.getJid() };
          }),
          datumTokenizer: function(d) {
            return Bloodhound.tokenizers.whitespace(d.name);
          },
          queryTokenizer: Bloodhound.tokenizers.whitespace
        });

        bhUsers.initialize();

        // Typeahead UI
        $('#users-input').typeahead({
          itemValue: 'jid',
          itemText: 'name',
          hint: true,
          highlight: true,
          minLength: 1
        },{
          name: 'users',
          displayKey: 'name',
          source: bhUsers.ttAdapter()
        });

        // Add a new place for tags to go
        $('#users-input').before(self.Template.tagholder);

        // Bind the selection event for typeahead.
        $('#users-input').bind('typeahead:selected', function(ev, suggestion) {
          // Append the tag
          if ($('.tagholder .input-tag[data-userjid="' + suggestion.jid + '"]').length === 0) {
            $('.tagholder').append(Mustache.to_html(self.Template.tag, {
              userjid: suggestion.jid,
              username: suggestion.name
            }));
          }

          $('#users-input').val('');

          self.centerModal();

          $('.tagholder').scrollTop($('.tagholder').height());

          // Add remove button click handler
          $('.tagholder .input-tag .close-input-tag').click(function() {
            $(this).parent().remove();
          });
        });

        // Form submission handler
        $('#invite-users-muc').submit(function(ev) {
          ev.preventDefault();
          // Get all of the users chosen.
          var userTags = $('.tagholder .input-tag');
          // Send them invites.
          for (var i = 0; i < userTags.length; i++) {
              CandyShop.StaticLobby.Invite.Send($(userTags[i]).attr('data-userjid'), roomJid);
            $('.tagholder .input-tag[data-userjid="' + $(userTags[i]).attr('data-userjid') + '"]').remove();
          }
          Candy.View.Pane.Chat.Modal.hide();
          return false;
        });
      });
    }
  };

  self.centerModal = function(first) {
    // Center the modal better
    var windowHeight = $(window).height(),
        windowWidth = $(window).width(),
        objectHeight = $('#chat-modal').outerHeight(),
        objectWidth = $('#chat-modal').outerWidth(),
        newTop  = (windowHeight / 2) - (objectHeight / 2),
        newLeft = (windowWidth / 2) + (objectWidth / 2);
    if (first) {
      $('#chat-modal').css({
        left: newLeft,
        top: newTop
      });
    } else {
      $('#chat-modal').animate({
        left: newLeft,
        top: newTop
      }, 'fast');
    }
  };

  // Display the set topic modal and add submit handler.
  self.sendNewTopic = function(roomJid, topic) {
    if(topic === '') { topic = ' '; }
    // Even though it does the exact same thing, Candy.View.Pane.Room.setSubject(roomJid, topic) was not sending the stanza out.
    Candy.Core.getConnection().muc.setTopic(Candy.Util.escapeJid(roomJid), topic);
  };

  self.Template = {
    tagholder: '<div class="tagholder"></div>',
    tag: '<span class="input-tag" data-userjid={{userjid}}>{{username}}<span class="close-input-tag">x</span></span>',
    roombar: '<div class="roombar"><div class="topic"></div></div>',
    inviteButton: '<button class="invite-users btn btn-default btn-sm">Invite Users</button>',
    inviteModal: '<h4>Invite Users</h4><form id="invite-users-muc" data-roomjid={{roomjid}}><div class="form-group">' +
                  '<input type="text" name="bhUsers" class="tm-input form-control" ' +
                  'id="users-input"/></div><button class="btn btn-default" type="submit">Send Invitations</button></form>'
  };

  return self;
}(CandyShop.RoomBar || {}, Candy, jQuery));
