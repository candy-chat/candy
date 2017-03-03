# Bookmark

A plugin for Candy Chat to allow managing MUC bookmarks

## Usage

Include the JavaScript file:

```HTML
<script type="text/javascript" src="candyshop/bookmark/bookmark.js"></script>
```

To enable this plugin, add its `init` method after you `init` Candy, but before `Candy.connect()`:

```JavaScript
CandyShop.Bookmark.init();
```

When you wish to bookmark a room, simply:

```JavaScript
CandyShop.Bookmark.add('someroom@conference.example.com');
```

If you would like for bookmarks to destroy when the room is closed, add this to your main JS file:
```JavaScript
  $(Candy).on('candy:view.room.after-close', function (ev, obj) {
    CandyShop.Bookmark.remove(obj.roomJid);
  });
```
