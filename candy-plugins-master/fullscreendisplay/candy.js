/** File: candy.js
 * Candy - Chats are not dead yet.
 *
 * Authors:
 *   - Jannis Achstetter <kripton@kripserver.net>
 */
var CandyShop = (function(self) { return self; }(CandyShop || {}));

/** Class: CandyShop.fullscreendisplay
 * Shows incoming messages to specified users starting with @ + username as large as the browser's content area, overlaying everything else. 
 */
CandyShop.fullscreendisplay = (function(self, Candy, $) {
	/** Object: _options
	 * Options for this plugin's operation
	 *
	 * Options:
	 *   (Array of String) fullscreenUsers - The usernames for which to display the messages as fullscreen
	 */
	var _options = {
		fullscreenUsers: []
	};
	
	var _getNick = function() {
		return Candy.Core.getUser().getNick();
	};
	
	/** Function: init
	 * Initialize the fullscreendisplay plugin
	 * Bind to after-Show
	 *
	 * Parameters:
	 *   (Object) options - The options to apply to this plugin
	 */
	self.init = function(options) {
		// apply the supplied options to the defaults specified
		$.extend(true, _options, options);
		
		// Create the div that is hidden by default
		var container = document.createElement('div');
		container.setAttribute('id', 'candy-fullscreendisplay-message');
		document.body.appendChild(container);

		// bind to the after-Show event
		$(Candy).on('candy:view.message.after-show', function(e, args) {
			//console.log('MESSAGE: ' + args.message);
			
			// Check if the message is intended for us and in the correct format
			var regex = new RegExp('^(@' + _getNick() + ':)(.*)', 'ig');
			if (!regex.test(args.message)) {
				return args.message;
			}
			
			//console.log('MESSAGE MATCHES PATTERN');
		  
			// Check if we are in the list of users to display the message in fullscreen
			var match = false;
			options.fullscreenUsers.forEach(function(name) {
				if (name.toLowerCase() == _getNick().toLowerCase()) {
					match = true;
				}
			});
			if (!match) {
				return args.message;
			}
			
			console.log('WE ARE TO DISPLAY IT FULLSCREEN');
			
			// Change the text in the container and display it without the user-name-prefix
			container.innerHTML = args.message.replace(regex, '$2');
			container.style.display = 'inline';
			
			// Now make the text as large as possible while still displaying the whole text
			var fontsize = 1000;
			container.style.fontSize = fontsize + 'px';
			while ((container.scrollWidth > container.offsetWidth) || (container.scrollHeight > container.offsetHeight)) {
			  fontsize--;
			  container.style.fontSize = fontsize + 'px';
			}
			
			return args.message;
		});
	};

	return self;
}(CandyShop.fullscreendisplay || {}, Candy, jQuery));
