# Slash Commands Plugin
A plugin to provide a command-line interface to Candy actions.

## Examples
To use any of the following, just type them into the chat input text area. Note that any commands which are room-specific (`/topic`, `/kick`, etc) will work on/for the current room only.

### Room Management

* `/join room` OR `/join room roomPassword` - Joins the MUC room "room" with an optional password.
* `/nick newNickname` - Change the name displayed to everybody
* `/part` OR `/leave` - Leaves the current MUC room.
* `/topic This will be the new topic` - Sets the topic for the current room to "This will be the new topic". May not work due to server settings.
* `/clear` - Clears the scrollback in the current room.
* `/invite user` (from the room) OR `/invite <user> room roomPassword` - Invites the user/nickname to the specified room, or current room, with optional password.
* `/kick nickname` OR `/kick <nickname> comment` - Ejects the user "username" from the current room, possibly with explaination. Must be a MUC admin for this to work.

### Presence

* `/available`
* `/away`
* `/dnd` - Do Not Disturb

## Configuration

For the commands that work on rooms (such as `/join`) you can specify the default domain to be suffixed to the room name:

```JavaScript
CandyShop.SlashCommands.defaultConferenceDomain = 'muc.example.com';
```

If unset, it defaults to the user's XMPP domain prefixed with "conference."

## Usage
Include the JavaScript file::

```HTML
<script type="text/javascript" src="candyshop/slash-commands/slash-commands.js"></script>
```

To enable the Slash Commands Plugin, just add one of the ´init´ methods to your bootstrap:

```JavaScript
CandyShop.SlashCommands.init();
```
