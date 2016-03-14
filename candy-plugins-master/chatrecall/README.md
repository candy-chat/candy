# Chat recall plugin
This plugin will allow the user to navigate through historical messages they've typed using the up and down keys

## Usage
Include the JavaScript file:

```HTML
<script type="text/javascript" src="path_to_plugins/chatrecall/candy.js"></script>
```

Call its `init()` method after Candy has been initialized:

```JavaScript
Candy.init('/http-bind/');

CandyShop.ChatRecall.init();

Candy.Core.connect();
```

## Configuration options
`messagesToKeep` - Integer - The number of messages to store in history. Defaults to 10

## Example configurations
```JavaScript
// Store 25 messages for the user to scroll through
CandyShop.ChatRecall.init({
    messagesToKeep: 25
});
```