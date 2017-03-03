/** File: candy.js
 * Candy - Chats are not dead yet.
 *
 * Authors:
 *   - Troy McCabe <troy.mccabe@geeksquad.com>
 *
 * Copyright:
 *   (c) 2012 Geek Squad. All rights reserved.
 */

/* global document, Candy, jQuery */

var CandyShop = (function(self) { return self; }(CandyShop || {}));

/** Class: CandyShop.ChatRecall
 * Remembers the last {x} messages the user types and allows up and down key recollection
 */
CandyShop.ChatRecall = (function(self, Candy, $) {
    /** Object: _options
     * Options:
     *   (Integer) messagesToKeep - How many messages to keep in memory
     */
    var _options = {
        messagesToKeep: 10
    };

    /** Array: _messages
     * The messages that the user sent
     */
    var _messages = [];

    /** Integer: _currentMessageIndex
     * The current index of the message the user went back to
     */
    var _currentMessageIndex = 0;

    /** Function: init
     * Initialize the ChatRecall plugin
     *
     * Parameters:
     *   (Object) options - An options packet to apply to this plugin
     */
    self.init = function(options) {
        // apply the supplied options to the defaults specified
        $.extend(true, _options, options);

        // Listen for keydown in the field
        $(document).on('keydown', 'input[name="message"]', function(e) {
            // switch on the key code
            switch (e.which) {
                // up arrow
                case 38:
                    // if we're under the cap of max messages and the cap of the messages currently stored, recall
                    if (_currentMessageIndex < _options.messagesToKeep && _currentMessageIndex < _messages.length) {
                        // if we're at blank (the bottom), move it up to 0
                        if (_currentMessageIndex === -1) {
                            _currentMessageIndex++;
                        }
                        // set the value to what we stored
                        $(this).val(_messages[_currentMessageIndex]);
                        // if we're under the limits, go ahead and move the tracked position up
                        if (_currentMessageIndex < _options.messagesToKeep - 1 && _currentMessageIndex < _messages.length - 1) {
                            _currentMessageIndex++;
                        }
                    }
                    break;

                // down arrow
                case 40:
                    // if we're back to the bottom, clear the field
                    // else move it down
                    if (_currentMessageIndex === -1) {
                        $(this).val('');
                    } else {
                        // if we're at the cap already, move it down initially (don't want to have to hit it twice)
                        if (_currentMessageIndex === _options.messagesToKeep - 1 || _currentMessageIndex === _messages.length - 1) {
                            _currentMessageIndex--;
                        }
                        // set the value to the one that's stored
                        $(this).val(_messages[_currentMessageIndex]);

                        if (_currentMessageIndex > -1) {
                            // move the tracked position down
                            _currentMessageIndex--;
                        }
                    }
                    break;
            }
        });

        // listen before send and add it to the stack
        $(Candy).on('candy:view.message.before-send', function(e, data) {
            // remove, in case there is the colors plugin, the |c:number| prefix
            self.addMessage(data.message.replace(/\|c:\d+\|/i, ''));
        });
    };

    /** Function: addMessage
     * Add a message to the front of the stack
     * This is stored New[0] -> Old[N]
     *
     * Parameters:
     *   (String) message - The message to store
     */
    self.addMessage = function(message) {
        // pop one off the end if it's too many
        if (_messages.length === _options.messagesToKeep) {
            _messages.pop();
        }

        // put the message at pos 0 and move everything else
        _messages.unshift(message);
    };

    return self;
}(CandyShop.ChatRecall || {}, Candy, jQuery));
