/*
* candy-refocus-plugin
* @version 1.0 (2014-01-26)
* @author warcode (github.com/warcode)
*
* This plugin puts the focus on the entry box if the user clicks in the message window/list.
*/

/* global Candy, jQuery */

var CandyShop = (function(self) { return self; }(CandyShop || {}));

CandyShop.Refocus = (function(self, Candy, $) {

    self.init = function() {
        Candy.Core.log('[Refocus] init');
        $(Candy.View.Pane).on('candy:view.room.after-show', roomAfterShow);
    };

    function roomAfterShow() {
        Candy.Core.log('[Refocus] roomAfterShow');
        try {
            $('.message-pane-wrapper').mousedown(function() {
                $('.message-form').children(".field")[0].focus();
                return false;
            });
        } catch (e) {
            Candy.Core.log('[Refocus] jQuery exception:');
            Candy.Core.log(e);
        }
    }

  return self;
}(CandyShop.Refocus || {}, Candy, jQuery));
