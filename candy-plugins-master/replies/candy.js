/*
 * candy-replies-plugin
 * @version 0.4 (2015-02-05)
 * @author Drew Harry (drew.harry@gmail.com)
 * Contributors:
 *	- Sudrien <_+github@sudrien.net>
 *
 * Adds @reply highlighting to chat messages to help with high velocity
 * conversations.
 */

/* global Candy, jQuery */

var CandyShop = (function(self) { return self; }(CandyShop || {}));

CandyShop.Replies = (function(self, Candy, $) {

	var requireAt = true,
		prefix = '',
		suffix = '';

	self.init = function( requireAtValue, prefixValue, suffixValue ) {
		requireAt = typeof requireAtValue !== 'undefined' ? requireAtValue : true;
		prefix = prefixValue !== undefined ? prefixValue : '';
		suffix = suffixValue !== undefined ? suffixValue : '';

		$(Candy).on('candy:view.message.after-show', handleOnShow);
		return self;
	};

	var handleOnShow = function(e, args) {
		var possibleNicks = $('.me').map(function(){ return $(this).attr('data-nick'); });
		possibleNicks.push(Candy.Core.getUser().getNick());

		$.unique(possibleNicks).each(function(key,nick) {
			if( RegExp("(\\W|^)" + ( requireAt ? '@' : '' ) + nick + "(\\W|$)" , "im").test(args.message) ) {
				$(args.element).addClass("mention");
			}
			if( prefix !== '' || suffix !== '') {
				var shortNick = nick.replace( RegExp("^" + prefix), "").replace( RegExp( suffix + "$"), "");
				if( RegExp("(\\W|^)" + ( requireAt ? '@' : '' ) + shortNick + "(\\W|$)" , "im").test(args.message) ) {
					$(args.element).addClass("mention");
				}
			}
		});
	}

	return self;

}(CandyShop.Replies || {}, Candy, jQuery));
