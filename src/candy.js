/** File: candy.js
 * Candy - Chats are not dead yet.
 *
 * Legal: See the LICENSE file at the top-level directory of this distribution and at https://github.com/candy-chat/candy/blob/master/LICENSE
 */
'use strict';

/* global jQuery */

/** Class: Candy
 * Candy base class for initalizing the view and the core
 *
 * Parameters:
 *   (Candy) self - itself
 *   (jQuery) $ - jQuery
 */
var Candy = (function(self, $) {
	/** Object: about
	 * About candy
	 *
	 * Contains:
	 *   (String) name - Candy
	 *   (Float) version - Candy version
	 */
	self.about = {
		name: 'Candy',
		version: '2.2.0'
	};

	/** Function: init
	 * Init view & core
	 *
	 * Parameters:
	 *   (String) service - URL to the BOSH interface
	 *   (Object) options - Options for candy
	 *
	 * Options:
	 *   (Boolean) debug - Debug (Default: false)
	 *   (Array|Boolean) autojoin - Autojoin these channels. When boolean true, do not autojoin, wait if the server sends something.
	 */
	self.init = function(service, options) {
		if (!options.viewClass) {
			options.viewClass = self.View;
		}
		options.viewClass.init($('#candy'), options.view);
		self.Core.init(service, options.core);
	};

	return self;
}(Candy || {}, jQuery));
