# fullscreendisplay plugin
Shows incoming messages to specified users starting with @ + username + : as large as the browser's content area, overlaying everything else. 

The use case might be a bit exotic but we use candy as intercom-chat (MUC) for technicians on festivals and concerts and mostly have one screen 
on the stage to be able to message the bands during their performance. With this plugin, we can use our intercom-chat to control that, too. 
However, no one will ever chat back from there, so it's no problem blocking all the screen space.
While we could just chat directly (without MUC) to the user and display every incoming message as fullscreen, we prefer MUC so that all 
other technicians are informed as well what's currently displayed on the band's screen.
Set browser to full-screen for best results.

### Usage
    <script type="text/javascript" src="path_to_plugins/fullscreendisplay/candy.js"></script>
    <link rel="stylesheet" type="text/css" href="path_to_plugins/fullscreendisplay/candy.css" />

    ...

    CandyShop.fullscreendisplay.init();

### Configuration options
`fullscreenUsers` - Array of String - The usernames for which to display the messages as fullscreen

### Example configurations

    // Display the text in fullscreen for MUC-users bandMainstage and bandUnpluggedstage
    CandyShop.fullscreendisplay.init({
        fullscreenUsers: ['bandMainstage', 'bandUnpluggedstage']
    });
