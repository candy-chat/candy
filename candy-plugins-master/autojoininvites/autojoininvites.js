/** File: autojoininvites.js
 * Candy Plugin Auto-Join Incoming MUC Invites
 * Author: Melissa Adamaitis <madamei@mojolingo.com>
 * Integrates with Bookmark plugin.
 */

var CandyShop = (function(self) { return self; }(CandyShop || {}));

CandyShop.AutoJoinInvites = (function(self, Candy, $) {
  /** Object: about
   *
   * Contains:
   *  (String) name - Candy Plugin Auto-Join Incoming MUC Invites
   *  (Float) version - Candy Plugin Auto-Join Incoming MUC Invites
   */
  self.about = {
    name: 'Candy Plugin Auto-Join Incoming MUC Invites',
    version: '1.0'
  };

  /**
   * Initializes the AutoJoinInvites plugin with the default settings.
   */
  self.init = function(){
    $(Candy).on('candy:core:chat:invite',function(ev, obj) {
      if (CandyShop.Bookmark) {
        CandyShop.Bookmark.add(obj.roomJid);
      }
      Candy.Core.Action.Jabber.Room.Join(obj.roomJid, null);
    });
  };

  return self;
}(CandyShop.AutoJoinInvites || {}, Candy, jQuery));
