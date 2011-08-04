function showArrow(button) {
	
}

$(document).ready(function() {
	$('#demobutton').click(function() {
		var showcase = $('#showcase');
		if(showcase.hasClass('demomode')) {
			showcase.html('');
			showcase.removeClass('demomode');
			$(this).text('Try the Demo').removeClass('demomode');
			$('#demoarrow').stop(true, true).fadeOut();
		} else {
			$('html,body').stop().animate({'scrollTop': Math.floor(showcase.offset().top) + 1});
			showcase.html('<iframe src="http://projects.koeniglich.ch/candy" scrolling="no" frameborder="0"></iframe>');
			showcase.addClass('demomode');
			$(this).text('ONLINE').addClass('demomode');
			$('#demoarrow').stop(true, true).fadeIn();
		}
	});	
});