/**************************************
Load Tippy tool tips with custom option
****************************************/ 
tippy(".headline", {
  delay: [400, 200],
  duration: [400, 100],
  theme:"google",
  arrow: true,
  arrowType: "round"
});


/**************************************** 
Handle Toggler To Show/Hide More Articles  
****************************************/

//Select all togglers on page
var togglers = document.querySelectorAll(".articles-toggler");

togglers.forEach(function(toggler){
  //Add click event listener to all togglers
  toggler.addEventListener("click", function(){
    console.log("Success");
    //Select all hidden article items for the specifically clicked toggler
    var hiddenItems = document.querySelectorAll(`.list-hidden--${this.getAttribute("data-website")}`);
    console.log(`.list-hidden--${this.getAttribute("data-website")}`);
    //Make changes for all selected hidden article items
    hiddenItems.forEach(function(hiddenItem){
      if(hiddenItem.style.display === "none"){
        // Make hidden article item visible
        hiddenItem.style.display = "block";
        // Change text of p element (first child of toggler element) to 'less'
        toggler.firstChild.textContent = "Less";
        //Change down arrow of arrow in toggler element to up
        toggler.firstChild.nextSibling.classList = "fas fa-arrow-up";
      } else {
        // Remove article item from page
        hiddenItem.style.display = "none";
        // Change text of p element (first child of toggler element) to 'more'
        toggler.firstChild.textContent = "More";
        //Change down arrow of arrow in toggler element to down
        toggler.firstChild.nextSibling.classList = "fas fa-arrow-down";
      }
    });
  });
});


/***********************************
Strike through clicked article links
************************************/
var links = document.querySelectorAll(".headline");
links.forEach(function(link){
  link.addEventListener("click", function(){
    this.style.textDecoration = "line-through";
  });
});


/************************************************

Change color of Selected Elements On Page Scroll - https://pqina.nl/blog/applying-styles-based-on-the-user-scroll-position-with-smart-css/

***********************************************/

// The debounce function receives our function as a parameter
const debounce = (fn) => {

  // This holds the requestAnimationFrame reference, so we can cancel it if we wish
  let frame;

  // The debounce function returns a new function that can receive a variable number of arguments
  return (...params) => {

    // If the frame variable has been defined, clear it now, and queue for next frame
    if (frame) {
      cancelAnimationFrame(frame);
    }

    // Queue our function call for the next frame
    frame = requestAnimationFrame(() => {

      // Call our function and pass any params we received
      fn(...params);
    });
  }
};

// Reads out the scroll position and stores it in the data attribute
// so we can use it in our stylesheets
const storeScroll = () => {

  /************************************* 
  Calculates Fraction of Page Scrolled - https://stackoverflow.com/questions/2481350/how-to-get-scrollbar-position-with-javascript
  **************************************/

  // Position of scroll: from 0 to distance scrolled on page
  let heightScrolled = document.documentElement.scrollTop;
  // Calculates maximum height/distance document can be scrolled
  let maxScrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  // Fraction of page scrolled - from 0 to 1
  let fractionScrolled = heightScrolled / maxScrollHeight;
  
  if (fractionScrolled >= 1) {
    document.documentElement.dataset.scroll = 3;
  } else if (fractionScrolled >= 0.66) {
    document.documentElement.dataset.scroll = 2;
  } else if (fractionScrolled >= 0.33) {
    document.documentElement.dataset.scroll = 1;
  } else {
    document.documentElement.dataset.scroll = 0;
  }
}

// Listen for new scroll events, here we debounce our `storeScroll` function
document.addEventListener('scroll', debounce(storeScroll));

// Update scroll position for first time
storeScroll();