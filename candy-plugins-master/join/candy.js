/** File: candy.js
 * Candy join room over command
 *
 * Authors:
 *  - Jonatan Männchen <jonatan.maennchen@amiadogroup.com>
 *
 * Copyright:
 *  - (c) 2012 Amiado Group AG. All rights reserved.
 */

/* global Candy, jQuery */

var CandyShop = (function(self) { return self; }(CandyShop || {}));

CandyShop.Join = (function(self, Candy, $) {
	/** Function: init
	 * Initializes the join plugin with the default settings.
	 */
	self.init = function(){
		$(Candy).bind('candy:view.message.before-send', function(e, args) {
			// (strip colors)
			// if it matches '/join', join room and don't send anything
			if (args.message.replace(/\|c:\d+\|/, '').substring(0, 5).toLowerCase() === '/join') {
				self.joinRoom(args.message.replace(/\|c:\d+\|/, '').substring(6).toLowerCase());
				args.message = '';
			}
		});
	};

	/** Function: joinRoom
	 * Join a room
	 *
	 * Parameters:
	 *   (String) args
	 */
	self.joinRoom = function(args) {
		args = args.split(' ');
		if(typeof args[0] !== 'undefined' && typeof args[1] !== 'undefined') {
			Candy.Core.Action.Jabber.Room.Join(args[0] + '@conference.' + Candy.Core.getConnection().domain, args[1]);
		} else if(typeof args[0] !== 'undefined' && args[0] !== '') {
			Candy.Core.Action.Jabber.Room.Join(args[0] + '@conference.' + Candy.Core.getConnection().domain);
		}
	};

	return self;
}(CandyShop.Join || {}, Candy, jQuery));
