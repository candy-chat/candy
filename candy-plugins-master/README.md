# Candy Plugins

[![Build Status](https://travis-ci.org/candy-chat/candy-plugins.png)](https://travis-ci.org/candy-chat/candy-plugins)
[![Coverage Status](https://coveralls.io/repos/candy-chat/candy-plugins/badge.png)](https://coveralls.io/r/candy-chat/candy-plugins)

This is the official plugin repository for [Candy](http://candy-chat.github.com/candy), a JavaScript based multi-user chat client.

## List of available plugins
* __Auto-Join Invites__ - Automatically joins any and all incoming MUC invites.
* __available-rooms__ - A plugin to show & join public rooms.
* __Chat Recall__ - Saves the last {x} messages to scroll through with up and down arrows, similar to terminal/cmd.
* __Clearchat__ - Clears chat window on click or if typing `/clear`
* __Colors__ - Send and receive colored messages.
* __Colors XHTML__ - Send and receive colored messages formatted with XHTML.
* __Create Room__ - Creates a clickable UI for creating and joining rooms.
* __Emphasis__ - basic text formatting via textile, BBcode, or xhtml
* __Fullscreen Display__ - Shows incoming messages to specified users starting with @ + username + : as large as the browser's content area, overlaying everything else.
* __Inline Images__ - If a user posts a URL to an image, that image gets rendered directly inside of Candy.
* __Inline Videos__ - If a user posts a URL to youtube video, it embeds the youtube video iframe into Candy.
* __join__ A plugin that allows to type `/join room [password]` to join a room.
* __jQuery-Ui__ - jQuery UI lightness theme
* __Left Tabs__ - Moves the tabs to the left side and uses a bit of Bootstrap3-friendly theme elements.
* __Modify Role__ - Adds **add moderator** and **remove moderator** context menu links.
* __Me Does__ - special formatting for /me messages
* __Namecomplete__ - Autocompletes names of users within room
* __Nickchange__ - Enable your users to change the nick using a toolbar icon
* __Notifications__ - OS Notifications in webkit
* __Notifyme__ - Notifies yourself in case one does use your nickname in a message
* __Refocus__ - This plugin puts the focus on the entry box if the user clicks somewhere in the message list.
* __Remove Ignore__ - Removes the option to ignore/unignore a user from the roster.
* __Replies__ - Highlight any message that contains "@my_username"
* __MUC Room Bar__ - Adds a bar to the top of the message pane that displays the room topic and allows moderators to click-to-edit.
* __Room Panel__ - Provides a list of rooms available to join.
* __Static Lobby__ - Creates a static lobby UI and pulls in a global roster. Allows you to invite people from global roster to other MUCs you are participating in.
* __Sticky Subject__ - Retains the subject of the room underneath the tab itself.
* __Timeago__ - Replaces the exact time/date with fuzzy timestamps like "2 minutes ago".
* __Typing Notifications__ - Displays a user's typing notification status above the text entry form.

## Contributing
Please submit a pull request with your plugin or your changes to a plugin. We'll gladly merge it.

After a successful merge of a pull request, we will give you **push access** to this repository. You can then update your plugin on your own. If you update other plugins, please consider creating a pull request in order to inform the original plugin owner.

When contributing, please make sure that your code is of **high quality** and similar to other code in this repository. Also please submit a **screenshot** and a **README.md**.

1. [Setup the Vagrant environment from Candy core](https://github.com/candy-chat/candy/blob/dev/CONTRIBUTING.md)
2. Install [Node.js](http://nodejs.org/)
3. Install [Grunt](http://gruntjs.com/) (`npm install -g grunt-cli`)
4. Install [Bower](http://bower.io/) (`npm install -g bower`)
5. Install npm dependencies (`npm install` in candy-plugins root directory)
6. Install bower dependencies (`bower install` in candy-plugins root directory)
7. Run `grunt watch` to automatically run jshint (syntax checker) and the tests while developing.

### Running tests

* Tests are run using [Intern](http://theintern.io).
* `grunt` and `grunt watch` will each run unit tests in Chrome on Linux (for fast feedback).
* `grunt test` will run both unit and integration tests in a variety of environments. Tests are run using Selenium Standalone and Phantom.JS while developing, and on Sauce Labs in CI or using `grunt test`.
* If you don't want to use the Vagrant box to run Selenium/PhantomJS, set `CANDY_VAGRANT='false'` to run tests.

## Support & Community
Take a look at our [FAQ](https://github.com/candy-chat/candy/wiki/Frequently-Asked-Questions). If it doesn't solve your questions, you're welcome to join our [Mailinglist on Google Groups](http://groups.google.com/group/candy-chat).
You don't need to have a Gmail account for it.
