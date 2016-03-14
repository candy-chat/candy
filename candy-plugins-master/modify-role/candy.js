/** File: candy.js
 * Plugin for modifying roles. Currently implemented: op & deop
 *
 * Authors:
 *   - Michael Weibel <michael.weibel@gmail.com>
 *
 * License: MIT
 *
 * Copyright:
 *   (c) 2014 Michael Weibel. All rights reserved.
 */

/* global Candy, jQuery, Strophe, $iq */

var CandyShop = (function(self) { return self; }(CandyShop || {}));

/** Class: CandyShop.ModifyRole
 * Remove the ignore option in the roster
 */
CandyShop.ModifyRole = (function(self, Candy, $) {

    var modifyRole = function modifyRole(role, roomJid, user) {
        var conn = Candy.Core.getConnection(),
            nick = user.getNick(),
            iq = $iq({
                'to': Candy.Util.escapeJid(roomJid),
                'type': 'set'
            });

        iq.c('query', {'xmlns': Strophe.NS.MUC_ADMIN})
            .c('item', {'nick': nick, 'role': role});

        conn.sendIQ(iq.tree());
    };

    var applyTranslations = function applyTranslations() {
        var addModeratorActionLabel = {
          'en' : 'Grant moderator status',
          'de' : 'Moderator status geben'
        };
        var removeModeratorActionLabel = {
          'en' : 'Remove moderator status',
          'de' : 'Moderator status nehmen'
        };

        $.each(addModeratorActionLabel, function(k, v) {
            if(Candy.View.Translation[k]) {
                Candy.View.Translation[k].addModeratorActionLabel = v;
            }
        });
        $.each(removeModeratorActionLabel, function(k, v) {
            if(Candy.View.Translation[k]) {
                Candy.View.Translation[k].removeModeratorActionLabel = v;
            }
        });
    };

    var isOwnerOrAdmin = function(user) {
        return ['owner', 'admin'].indexOf(user.getAffiliation()) !== -1;
    };
    var isModerator = function(user) {
        return user.getRole() === 'moderator';
    };

    /** Function: init
     * Initializes the plugin by adding an event which modifies
     * the contextmenu links.
     */
    self.init = function init() {
        applyTranslations();

        $(Candy).bind('candy:view.roster.context-menu', function(e, args) {
            args.menulinks.addModerator = {
                requiredPermission: function(user, me) {
                    return me.getNick() !== user.getNick() && isOwnerOrAdmin(me) && !isOwnerOrAdmin(user) && !isModerator(user);
                },
                'class' : 'add-moderator',
                'label' : $.i18n._('addModeratorActionLabel'),
                'callback' : function(e, roomJid, user) {
                    modifyRole('moderator', roomJid, user);
                }
            };
            args.menulinks.removeModerator = {
                requiredPermission: function(user, me) {
                    return me.getNick() !== user.getNick() && isOwnerOrAdmin(me) && !isOwnerOrAdmin(user) && isModerator(user);
                },
                'class' : 'remove-moderator',
                'label' : $.i18n._('removeModeratorActionLabel'),
                'callback' : function(e, roomJid, user) {
                    modifyRole('participant', roomJid, user);
                }
            };
        });
    };

    return self;
}(CandyShop.ModifyRole || {}, Candy, jQuery));
