# Remove ignore plugin
This plugin will remove the option to ignore another user

## Usage
Include the JavaScript file:

```HTML
<script type="text/javascript" src="path_to_plugins/removeignore/candy.js"></script>
```

Call its `init()` method after Candy has been initialized:

```JavaScript
Candy.init('/http-bind/');

CandyShop.RemoveIgnore.init();

Candy.Core.connect();
```