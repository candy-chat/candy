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

/** Class: CandyShop.NotifyMe
 * Notifies with a sound and highlights the text in the chat when a nick is called out
 */
CandyShop.NotifyMe = (function(self, Candy, $) {
	/** Object: _options
	 * Options for this plugin's operation
	 *
	 * Options:
	 *   (String) nameIdentifier - Prefix to append to a name to look for. '@' now looks for '@NICK', '' looks for 'NICK', etc. Defaults to '@'
	 *   (Boolean) playSound - Whether to play a sound when identified. Defaults to true
	 *   (Boolean) highlightInRoom - Whether to highlight the name in the room. Defaults to true
	 *   (Boolean) normalizeNickname - Whether to normalize the casing of the nickname to the way you entered it.  Otherwise, leave the casing as the sender wrote it. Defaults to true
	 */
	var _options = {
		nameIdentifier: '@',
		playSound: true,
		highlightInRoom: true,
		normalizeNickname: true
	};

	var _getNick = function() {
		return Candy.Core.getUser().getNick();
	};

	var _getSearchTerm = function() {
		// make it what is searched
		// search for <identifier>name in the whole message
		return _options.nameIdentifier + _getNick();
	};

	/** Function: init
	 * Initialize the NotifyMe plugin
	 * Bind to beforeShow, play sound and higlight if specified
	 *
	 * Parameters:
	 *   (Object) options - The options to apply to this plugin
	 */
	self.init = function(options) {
		// apply the supplied options to the defaults specified
		$.extend(true, _options, options);

		// bind to the beforeShow event
		$(Candy).on('candy:view.message.before-show', function(e, args) {
			var searchRegExp = new RegExp('^(.*)(\s?' + _getSearchTerm() + ')', 'ig');

			// if it's in the message and it's not from me, do stuff
			// I wouldn't want to say 'just do @{MY_NICK} to get my attention' and have it knock...
			if (searchRegExp.test(args.message) && args.name != _getNick()) {
				// play the sound if specified
				if (_options.playSound) {
					Candy.View.Pane.Chat.Toolbar.playSound();
				}

				// Save that I'm mentioned in args
				args.forMe = true;
			}

			return args.message;
		});

		// bind to the beforeShow event
		$(Candy).on('candy:view.message.before-render', function(e, args) {
			var searchTerm = _getSearchTerm();
			var searchMatch = new RegExp('^(.*)(\s?' + searchTerm + ')', 'ig').exec(args.templateData.message);

			// if it's in the message and it's not from me, do stuff
			// I wouldn't want to say 'just do @{MY_NICK} to get my attention' and have it knock...
			if (searchMatch != null && args.templateData.name != _getNick()) {
				// highlight if specified
				if (_options.highlightInRoom) {
					var displayNickName = searchTerm;
					if (!_options.normalizeNickname) {
						displayNickName = searchMatch[2];
					}
					args.templateData.message = args.templateData.message.replace(searchMatch[2], '<span class="candy-notifyme-highlight">' + displayNickName + '</span>');
				}
			}
		});
	};

	return self;
}(CandyShop.NotifyMe || {}, Candy, jQuery));
