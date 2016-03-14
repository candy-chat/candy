# Clear chat plugin
This plugin adds a "clear chat" button, as well as the ability to type `/clear` to clear the current chat pane

### Usage
    <script type="text/javascript" src="path_to_plugins/clearchat/candy.js"></script>
    <link rel="stylesheet" type="text/css" href="path_to_plugins/clearchat/candy.css" />

    ...

    CandyShop.ClearChat.init();

### Example configurations

    // Show the clear chat button
    CandyShop.ClearChat.init(true);

    // Only allow `/clear`, do not show the button
    CandyShop.ClearChat.init(false);