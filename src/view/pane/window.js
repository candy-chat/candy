/** File: window.js
 * Candy - Chats are not dead yet.
 *
 * Legal: See the LICENSE file at the top-level directory of this distribution and at https://github.com/candy-chat/candy/blob/master/LICENSE
 */
'use strict';

/* global Candy, jQuery, window */

/** Class: Candy.View.Pane
 * Candy view pane handles everything regarding DOM updates etc.
 *
 * Parameters:
 *   (Candy.View.Pane) self - itself
 *   (jQuery) $ - jQuery
 */
Candy.View.Pane = (function(self) {

  /** Class: Candy.View.Pane.Window
   * Window related view updates
   */
  self.Window = {
    /** PrivateVariable: _hasFocus
     * Window has focus
     */
    _hasFocus: true,
    /** PrivateVariable: _plainTitle
     * Document title
     */
    _plainTitle: window.top.document.title,
    /** PrivateVariable: _unreadMessagesCount
     * Unread messages count
     */
    _unreadMessagesCount: 0,

    /** Variable: autoscroll
     * Boolean whether autoscroll is enabled
     */
    autoscroll: true,

    /** Function: hasFocus
     * Checks if window has focus
     *
     * Returns:
     *   (Boolean)
     */
    hasFocus: function() {
      return self.Window._hasFocus;
    },

    /** Function: increaseUnreadMessages
     * Increases unread message count in window title by one.
     */
    increaseUnreadMessages: function() {
      self.Window.renderUnreadMessages(++self.Window._unreadMessagesCount);
    },

    /** Function: reduceUnreadMessages
     * Reduce unread message count in window title by `num`.
     *
     * Parameters:
     *   (Integer) num - Unread message count will be reduced by this value
     */
    reduceUnreadMessages: function(num) {
      self.Window._unreadMessagesCount -= num;
      if(self.Window._unreadMessagesCount <= 0) {
        self.Window.clearUnreadMessages();
      } else {
        self.Window.renderUnreadMessages(self.Window._unreadMessagesCount);
      }
    },

    /** Function: clearUnreadMessages
     * Clear unread message count in window title.
     */
    clearUnreadMessages: function() {
      self.Window._unreadMessagesCount = 0;
      window.top.document.title = self.Window._plainTitle;
    },

    /** Function: renderUnreadMessages
     * Update window title to show message count.
     *
     * Parameters:
     *   (Integer) count - Number of unread messages to show in window title
     */
    renderUnreadMessages: function(count) {
      window.top.document.title = Candy.View.Template.Window.unreadmessages.replace('{{count}}', count).replace('{{title}}', self.Window._plainTitle);
    },

    /** Function: onFocus
     * Window focus event handler.
     */
    onFocus: function() {
      self.Window._hasFocus = true;
      if (Candy.View.getCurrent().roomJid) {
        self.Room.setFocusToForm(Candy.View.getCurrent().roomJid);
        self.Chat.clearUnreadMessages(Candy.View.getCurrent().roomJid);
      }
    },

    /** Function: onBlur
     * Window blur event handler.
     */
    onBlur: function() {
      self.Window._hasFocus = false;
    }
  };

  return self;
}(Candy.View.Pane || {}, jQuery));
