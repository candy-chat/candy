/** File: message.js
 * Candy - Chats are not dead yet.
 *
 * Authors:
 *   - Patrick Stadler <patrick.stadler@amiadogroup.com>
 *   - Michael Weibel <michael.weibel@amiadogroup.com>
 *   - Patrick Forget <patforg@geekpad.ca>
 *
 * Copyright:
 *   (c) 2011 Amiado Group AG. All rights reserved.
 */

/** Class: Candy.Core.Message
 * Chat messages 
 *
 * Parameters:
 *   (String) text - the message text
 */
Candy.Core.Message = function(text, type) {
	/** String: _text
	 * contains message text
	 */
	this._text = text;
	
        /** String: _type
	 * type of message
	 */
	this._type = type;
	
	/** Function: setText
	 * Set the message's text
	 *
	 * Parameters:
	 *   (String) text - message text to set
	 */
	this.setText = function(text) {
		this._text = text;
	};
	
	/** Function: getText
	 * Get message text
	 *
	 * Returns:
	 *   (String) - the message's text
	 */
	this.getText = function() {
		return this._text;
	};
	
};