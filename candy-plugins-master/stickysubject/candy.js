/** File: candy.js
 * Candy - Chats are not dead yet.
 *
 * Authors:
 *   - Troy McCabe <troy.mccabe@geeksquad.com>
 *
 * Copyright:
 *   (c) 2012 Geek Squad. All rights reserved.
 */

/* global Candy, jQuery */

var CandyShop = (function(self) { return self; }(CandyShop || {}));

/** Class: CandyShop.StickySubject
 * This plugin makes it so the room subject is always visible
 */
CandyShop.StickySubject = (function(self, Candy, $) {
    /** Function: init
     * Initialize the StickySubject plugin
     */
    self.init = function() {
        // Listen for a subject change in the room
        $(Candy).on('candy:view.room.after-subject-change', function(e, data) {
            // get the current message pane and create the text
            var $messagePane = $(Candy.View.Pane.Room.getPane(Candy.View.getCurrent().roomJid)),
                subjectText = $.i18n._('roomSubject') + ' ' + data.subject;

            // if we don't have the subject container yet, add it
            // else just update the content
            if ($('.candy-subject-container:visible').length === 0) {
                $messagePane.prepend('<div class="candy-subject-container">' + subjectText + '</div>');
                $messagePane.find('.message-pane-wrapper').addClass('candy-has-subject');
            } else {
                $messagePane.find('.candy-subject-container').html(subjectText);
            }
        });
    };

    return self;
}(CandyShop.StickySubject || {}, Candy, jQuery));
