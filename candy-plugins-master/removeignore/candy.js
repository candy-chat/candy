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

/** Class: CandyShop.RemoveIgnore
 * Remove the ignore option in the roster
 */
CandyShop.RemoveIgnore = (function(self, Candy, $) {
    /** Function: init
     * Initialize this plugin to remove the ignore option
     */
    self.init = function() {
        // bind to the contextmenu event so we can modify the links
        $(Candy).bind('candy:view.roster.context-menu', function(e, args) {
            // override the ignore so that nobody has permission
            args.menulinks.ignore = {
                requiredPermission: function() { return false; }
            };
        });
    };

    return self;
}(CandyShop.RemoveIgnore || {}, Candy, jQuery));
