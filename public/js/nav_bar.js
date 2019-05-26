var tabs = $('.tabs');
var selector = $('.tabs').find('a').length;
//var selector = $(".tabs").find(".selector");
var activeItem = tabs.find('.active');
var activeWidth = activeItem.innerWidth();
$(".selector").css({
    "left": activeItem.position.left + "px",
    "width": activeWidth + "px"
});
var tab;
$(".tabs").on("click", "a", function (e) {
    e.preventDefault();
    $('.tabs a').removeClass("active");
    // localStorage.setItem("selectedTab", this.getAttribute("id"));
    window.location.href = this.getAttribute("href");
});


// on load of the page: switch to the currently selected tab
$(document).ready(function () {
    var tab = document.getElementById(localStorage.getItem("selectedTab"));
    if (tab == null) {
        tab = document.getElementById("your_health");
    }
    $(tab).addClass('active');
    var activeWidth = $(tab).innerWidth();
    var itemPos = $(tab).position();
    $(".selector").css({
        "left": itemPos.left + "px",
        "width": activeWidth + "px"
    });
});
