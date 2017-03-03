/** File: bookmark.js
 * Candy Plugin - Bookmark rooms
 * Author: Ben Langfeld <blangfeld@mojolingo.com>
 */

/* global Candy, jQuery, Strophe, $iq */

var CandyShop = (function(self) { return self; }(CandyShop || {}));

CandyShop.Bookmark = (function(self, Candy, $) {
  self.init = function(){
    $(Candy).on('candy:view.connection.status-5', function(){
      self._createBookmarksNode();
      return true;
    });
  };
/** File: bookmark.js
 * Candy Plugin - Bookmark rooms
 * Author: Ben Langfeld <blangfeld@mojolingo.com>
 */

var CandyShop = (function(self) { return self; }(CandyShop || {}));

CandyShop.Bookmark = (function(self, Candy, $) {
  /** Object: about
   *
   * Contains:
   *  (String) name - Candy Plugin - Bookmark rooms
   *  (Float) version - Candy Plugin - Bookmark rooms
   */
  self.about = {
    name: 'Candy Plugin - Bookmark rooms',
    version: '0.1'
  };

  self.init = function(){
    Strophe.addNamespace('PUBSUB', 'http://jabber.org/protocol/pubsub');
    $(Candy).on('candy:view.connection.status-5', self._createBookmarksNode);
    $(Candy).on('candy:view.connection.status-8', self._createBookmarksNode);
  };

  /** Function: add
   * Adds a bookmark for the provided MUC room
   *
   * Parameters:
   *   (String) roomJid - The JID of the room to bookmark
   */
  self.add = function(roomJid) {
    Candy.Core.getConnection().sendIQ($iq({
        type: 'set'
    })
      .c('pubsub', {xmlns: Strophe.NS.PUBSUB})
      .c('publish', {node: Strophe.NS.BOOKMARKS})
      .c('item', {id: roomJid})
      .c('storage', {xmlns: Strophe.NS.BOOKMARKS})
      .c('conference', {autojoin: 'true', jid: roomJid})
    );
  };

  /** Function: remove
   * Removes a bookmark for the provided MUC room
   *
   * Parameters:
   *   (String) roomJid - The JID of the room to remove from bookmarks
   */
  self.remove = function(roomJid) {
    Candy.Core.getConnection().sendIQ($iq({
        type: 'set'
    })
      .c('pubsub', {xmlns: Strophe.NS.PUBSUB})
      .c('retract', {node: Strophe.NS.BOOKMARKS})
      .c('item', {id: roomJid})
    );
  };

  self._createBookmarksNode = function() {
    // We do this instead of using publish-options because this is not mandatory to implement according to XEP-0060
    Candy.Core.getConnection().sendIQ($iq({type: 'set'})
      .c('pubsub', {xmlns: Strophe.NS.PUBSUB})
      .c('create', {node: 'storage:bookmarks'}).up()
      .c('configure')
      .c('x', {xmlns: 'jabber:x:data', type: 'submit'})
      .c('field', {'var': 'FORM_TYPE', type: 'hidden'})
      .c('value').t('http://jabber.org/protocol/pubsub#node_config').up().up()
      .c('field', {'var': 'pubsub#persist_items'}).c('value').t('1').up().up()
      .c('field', {'var': 'pubsub#access_model'}).c('value').t('whitelist')
    );

    return true;
  };

  return self;
}(CandyShop.Bookmark || {}, Candy, jQuery));
