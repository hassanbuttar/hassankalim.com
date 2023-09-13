jQuery(document).ready(function($) {
    $(window).scroll(function(){
        if($(window).scrollTop() > 200){
            $("#back-to-top").fadeIn(200);
        } else{
            $("#back-to-top").fadeOut(200);
        }
    });

    $('#back-to-top, .back-to-top').click(function() {
        $('html, body').animate({ scrollTop:0 }, '800');
        return false;
    });
});

jQuery(document).ready(function($) {
    $(".blog-post-audio p iframe").css({"width":"100%","height":"100"});
    $(".blog-post-video").fitVids();
    $(".portfolio-post-audio p iframe").css({"width":"100%","height":"100"});
    $(".portfolio-post-video").fitVids();
});

jQuery(document).ready(function($) {
    $(".owl-blog-list").owlCarousel({
    navigation : false,
    pagination : false,
    slideSpeed : 300,
    paginationSpeed : 400,
    singleItem:true
    });
});