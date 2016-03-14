# Name completion plugin
This plugin will complete the names of users in the room when a specified key is pressed.

### Usage
    <script type="text/javascript" src="path_to_plugins/namecomplete/candy.js"></script>
    <link rel="stylesheet" type="text/css" href="path_to_plugins/namecomplete/candy.css" />

    ...

    CandyShop.NameComplete.init();

### Configuration options
`nameIdentifier` - String - The identifier to look for in a string. Defaults to `'@'`

`completeKeyCode` - Integer - The key code of the key to use. Defaults to `9` (tab)

### Example configurations

    // complete the name when the user types +nick and hits the right arrow
    // +troymcc -> +troymccabe
    CandyShop.NameComplete.init({
        nameIdentifier: '+',
        completeKeyCode: '39'
    });

    // complete the name when the user types -nick and hits the up arrow
    // +troymcc ^ +troymccabe
    CandyShop.NameComplete.init({
        nameIdentifier: '-',
        completeKeyCode: '38'
    });