App = {};
//Define the API keys
App.foodApiKey = "d6903ecc4d9527464aae440a70035117";
App.foodId = "c75ffd32";
App.lcboApiKey = "MDpmMTk1NzlmYy1mZGYzLTExZTYtOWZiYy1iYjViNTI5MmY5ZjU6dDBvRXI2MHd4WnRUbFlhVUZBZGozNWRTMHVjbFhLRFhqTVFp";
App.flickrApiKey = "7ab4ea78c402af8e31977dcbec3ee9b5";
//Global variables
App.countrySelected;
App.lcboCountry;
App.result;

App.liqourClear = function() {

  //empty liquor styles list
  $('#style-select').empty();
  $('.description').empty();
  $('.image').empty();
  $('.display').slideUp('slow');
  $('.liquorButton').removeClass('selected');
  $('#style-select').append('<option>Loading....</option>')
}

App.events = function() {
  //select liquor type
  $('.redWine').on('click', function(){
    App.liqourClear();
    $(this).addClass('selected');
    App.getLCBOData("red wine");

  });
  $('.whiteWine').on('click', function(){
    App.liqourClear();
    $(this).addClass('selected');
    App.getLCBOData("white wine");
  });
  $('.beer').on('click', function(){
    App.liqourClear();
    $(this).addClass('selected');
    App.getLCBOData("beer");
  });
  //button to reload the page to go to another country
  $('.reload').on('click', function(){
    window.location.reload();
  });
  //go to the photos
  $('.photos').on('click', function(){
    $('html, body').animate({
           scrollTop: $("#photos").offset().top
       }, 2000);
  });
}

App.init = function(){
  //call the events function
  App.events();
 
  //svg map configuration and get the country selected variable
  jQuery('#vmap').vectorMap({ 
    map: 'world_en',
    onRegionClick: function(element, code, region)
        {
          App.countrySelected = region;
          $('.map').slideUp('slow');
          App.setupDisplayData();
          App.getWoeidData();

        }
  });
  $('.display').hide();

}

App.slider = function() {

  //start code for jquery slider
  var i= 0;
  //when the next button is clicked on
  $('.next').on("click", function(){
    //increase the display picture index by 1
    i = i + 1;
    //if we are at the end of the image queue, set the index back to 0
    if (i == $('.sliderContainer img').length) {
      i=0;
    }
    //set current image and previous image
    var currentImg = $('.sliderContainer img').eq(i);
    var prevImg = $('.sliderContainer img').eq(i-1);
    //call function to animate the rotation of the images to the right
    animateImage(prevImg, currentImg);  
  });
  //when the previous button is clicked on
  $('.previous').on("click", function(){
    //if we are at the beginning of the image queue, set the previous image to the first image and the current image to the last image of the queue
    if (i==0) { 
      prevImg = $('.sliderContainer img').eq(0);
      i=$('.sliderContainer img').length-1;
      currentImg = $('.sliderContainer img').eq(i);
    }
    //decrease the display picture index by 1
    else {
      i=i-1;
      //set current and previous images
      currentImg = $('.sliderContainer img').eq(i);
      prevImg = $('.sliderContainer img').eq(i+1);
    }
    //call function to animate the rotation of the images to the left
    animateImageLeft(prevImg, currentImg);  
  });
  //function to animate the rotation of the images to the left
  function animateImageLeft(prevImg, currentImg) {
    //move the image to be displayed off the visible container to the right
    currentImg.css({"left":"100%"});
    //slide the image to be displayed from off the container onto the visible container to make it slide from the right to left
    currentImg.animate({"left":"0%"}, 1000);
    //slide the previous image off the container from right to left
    prevImg.animate({"left":"-100%"}, 1000);
  }
  //function to animate the rotation of the images to the right
  function animateImage(prevImg, currentImg) {
    //move the image to be displayed off the container to the left
    currentImg.css({"left":"-100%"});
    //slide the image to be displayed from off the container onto the container to make it slide from left to right
    currentImg.animate({"left":"0%"}, 1000);
    //slide the image from on the container to off the container to make it slide from left to right
    prevImg.animate({"left":"100%"}, 1000); 
  }
}

App.getWoeidData = function() {
  var now = new Date()
  $.ajax({
    url: 'http://query.yahooapis.com/v1/public/yql',
    method: 'GET',
    dataType: 'json',
    data: {
      q: 'select * from geo.places where text="'+ App.countrySelected + '"',
      rnd:  now.getFullYear() + now.getMonth() + now.getDay(),
      format: 'json'

    }
  }).then(function(data){
    var woeid;
    if (data.query.results.place.length >=1) {
       woeid = data.query.results.place[0].woeid;
    }
    else {
       woeid = data.query.results.place.woeid;
    }
    App.getFlickrData(woeid);
  });
}

App.getFlickrData = function(woeid) {
  $.ajax({
    url: 'https://api.flickr.com/services/rest/',
    method: 'GET',
    dataType: 'json',
    data: {
      api_key: App.flickrApiKey,
      format: 'json',
      method: 'flickr.photos.search',
      safe_search: 1,
      content_type: 1,
      is_getty: "true",
      accuracy: 3,
      woe_id: woeid,
      has_geo: 1,
      sort: 'interestingness-desc',
      per_page: 50,
      nojsoncallback:1
      }
    }).then(function(data){
      var photosArray = data.photos.photo;
      //randomize the display order of the photos
      photosArray = _.shuffle(photosArray);
      $('#photos img').remove();
      //go through each photo item and append it to the photo container
      photosArray.forEach(function(photo) {
        var imgsrc = 'https://farm' + photo.farm + '.staticflickr.com/' + photo.server + '/' + photo.id + '_' + photo.secret + '_c.jpg';
        var image = $('<img>').attr('src', imgsrc);
        $('#photos').append(image);
      });
      //call the jquery slider function
      App.slider();
    });
}

App.getLCBOData = function(liquor){
  $.ajax({
      url: 'http://lcboapi.com/products',
      method: 'GET',
      dataType: 'jsonp',
      data: {
        where_not: 'is_dead,is_discontinued,is_seasonal',
        access_key: App.lcboApiKey,
        per_page: 100,
        q: liquor + ' + ' + App.lcboCountry
      }
  }).then(function(data){
      App.result = data.result;
      if (App.result.length === 0) {
        $('.description').empty();
        $('.description').append("<h2>Sorry no results for your selection at the LCBO</h2>");
        $('.display').slideDown('slow');
      }
      var styles = [];
      App.result.forEach(function(item){
          styles.push(item.style);
      });
      //make the styles array with only unique items, no duplicates!
      styles = _.uniq(styles);
      //populate selector with styles array
      $('#style-select').empty();
      var sel = $('#style-select');
      for(var i = 0; i < styles.length; i++) {
          // var opt = document.createElement('option');
          var opt = $('<option>');
          if (styles[i] !== null) {
          opt.innerHTML = styles[i];
          opt.value = styles[i];
          sel.append('<option>' + styles[i] + '</option>');
          }
      }
      var priceSelection;
      var style = $('#style-select').val();
      $('#style-select').on('change', function() {
         style = $(this).val();
      });
      $('.ten').on('click', function(){
        //empty liquor styles list
        $('.price').removeClass('selected');
        $(this).addClass('selected');
        priceSelection = 1000;
      });
       $('.twentyFive').on('click', function(){
        //empty liquor styles list
        $('.price').removeClass('selected');
        $(this).addClass('selected');
        priceSelection = 2500;
      });
        $('.twentySix').on('click', function(){
        //empty liquor styles list
        $('.price').removeClass('selected');
        $(this).addClass('selected');
        priceSelection = 2501;
      });
      
      $('.submit').on('click', function(){
         if (style !== undefined && priceSelection!== undefined) {
          App.displayLCBOData(App.result, style, priceSelection);
      }
      });
      
  });
}

App.displayLCBOData = function(result, style, priceSelection) {
  var resultSelection = result.filter(function(item){
    return item.style === style;
  });
  if (priceSelection === 1000){
    resultSelection = resultSelection.filter(function(item){
      return item.price_in_cents < priceSelection;
    });
  }
  if (priceSelection === 2500){
    resultSelection = resultSelection.filter(function(item){
      return item.price_in_cents <= priceSelection && item.price_in_cents >= 1000;
    });
  }
  if (priceSelection === 2501){
    resultSelection = resultSelection.filter(function(item){
      return item.price_in_cents > priceSelection;
    });
  }
  if (resultSelection.length === 0) {
    $('.description').empty();
    $('.image').empty();
    $('.description').append("<h2>Sorry no results for your selection at the LCBO</h2>");
    $('.display').slideDown('slow');
  } else {
  $('.description').empty();
  $('.image').empty();
  var random = Math.floor(Math.random() * (resultSelection.length));
  var image = $('<img>').attr('src', resultSelection[random].image_url);
  var name = $('<h3>').text(resultSelection[random].name);
  var producerName = $('<p>').text(resultSelection[random].producer_name);
  var package = $('<p>').text(resultSelection[random].package);
  if (resultSelection[random].tasting_note !== null) {
  var tasting_note = $('<p>').text(resultSelection[random].tasting_note);
  } else {
    var tasting_note = "";
  }
  var priceInDollars = (resultSelection[random].price_in_cents)/100;
  var price = $('<p>').text('$' + priceInDollars);
  $('.image').append(image);
  $('.description').append(name, producerName, package, price, tasting_note);
  $('.display').removeClass('invisible');
  $('.display').slideDown('slow');
  }
}

App.setupDisplayData = function() {
 
  //empty liquor styles list
  $('#style-select').empty();
  //need to change united states of america and russia for lcbo database
  if (App.countrySelected==="United States of America") {
    App.lcboCountry = 'USA';
  }
  else if (App.countrySelected==="Russian Federation") {
    App.lcboCountry = 'Russia';
  }
  else {
    App.lcboCountry = App.countrySelected;
  }
  $('.displayData h1').remove();
  $('.displayData').removeClass('invisible');
  $('.banner').addClass('invisible');
   $('.appDes').addClass('invisible');
  $('#lcbo').prepend('<h1>Welcome to ' + App.lcboCountry + '!</h1>');
}

$(function(){
  //initiates the app
  App.init();
});
