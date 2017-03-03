# /me Does

Format /me messages, implementing XEP-0245

## Usage
Include the JavaScript file:

```HTML
<script type="text/javascript" src="candyshop/me-does/candy.js"></script>
```

Call its `init()` method after Candy has been initialized:

```javascript
Candy.init('/http-bind/', {});

// enable /me handling
CandyShop.MeDoes.init();

Candy.Core.connect();
```

Now all messages starting with '/me 'will use infoMessage formatting.

```
/me takes screenshot
```

![Color Picker](me-does-screenshot.png)

**Please note**: As `me-does` reroutes message output, it's call to `init()` should happen after the `init()` of most other plugins, including, `inline-images`. 
