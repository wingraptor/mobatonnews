/**************************************** 
Handle Toggler To Show/Hide More Articles  
****************************************/

//Select all togglers on page
var togglers = document.querySelectorAll(".articles-toggler");

togglers.forEach(function (toggler) {
  //Add click event listener to all togglers
  toggler.addEventListener("click", function () {
    //Select all hidden article items for the specifically clicked toggler
    var hiddenItems = document.querySelectorAll(`.list-hidden--${this.getAttribute("data-website")}`);
    console.log(`.list-hidden--${this.getAttribute("data-website")}`);
    //Make changes for all selected hidden article items
    hiddenItems.forEach(function (hiddenItem) {
      if (hiddenItem.style.display === "none") {
        // Make hidden article item visible
        hiddenItem.style.display = "flex";
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


/**************************************************
Handle Toggler To Share Articles and see Article Info.
**************************************************/

// Select all article info togglers on page
let linkTogglers = document.querySelectorAll(".links-list li");

// Add event listener to all article info. toggler
linkTogglers.forEach(function (toggler) {
  toggler.addEventListener("click", function () {
    // Get articleID of corresponding article
    let articleID = this.getAttribute("data-articleID");
    // Select corresponding div containing links to share article
    let shareDiv = document.getElementById(articleID);

    // Select toggler icon; either +/-
    let togglerIcon = toggler.querySelector(".share-toggler");
    
    //Check to see if div with sharing links is not displayed
    if (shareDiv.style.display === "none") {
      //Display div with sharing links
      shareDiv.style.display = "block";
      //Change arrow to up arrow
      togglerIcon.classList = "fas fa-minus share-toggler";
    } else {
      //Remove div from page
      shareDiv.style.display = "none";
      //Change arrow to down arrow
      togglerIcon.classList = "fas fa-plus share-toggler";
    }
  });
});


/***********************************
Strike through clicked article links; cannot use a:visited pseudo-class :- http://bit.ly/2D3B6K9 
************************************/
let links = document.querySelectorAll(".headline");
links.forEach(function (link) {
  link.addEventListener("click", function () {
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



/**********************************************************
Set Max Date of End Date Form Field to Current Date
*********************************************************/

// Select End Date Element
let endDate = document.getElementById("endDate");

// Generate current date in UTC format -- https://stackoverflow.com/a/35922073
let today = new Date().toISOString().slice(0, 10);

// Only when date is on element is on page
if(endDate){
  // Set Max date Attr.
  endDate.setAttribute("max", today);

  // Ensures that endDate does not come before startDate
  document.querySelector("#startDate").addEventListener("input", function () {
    endDate.setAttribute("min", this.value);
  });
}





/*****************************************
Forms
****************************************/


// Date Input styling --> https://codepen.io/alvaromontoro/pen/YzXNjwm
let dateInputs = document.querySelectorAll("input[type='date']");

dateInputs.forEach(function (input) {
  input.addEventListener("input", function () {
    if (/^[0-9]{4}\-[0-9]{2}\-[0-9]{2}$/.exec(this.value)) {
      const day = parseInt(this.value.substring(8, 12));
      const top = Math.floor((day - 1) / 7) * 5 + 10;
      const left = ((day - 1) % 7) * 5 + 3;
      this.style.backgroundImage = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><g stroke='%23111' stroke-width='1' fill='none'><path d='M2,5 38,5 38,10 2,10Z' fill='%23e9a' /><path d='M2,5 38,5 38,10 2,10 2,15 38,15 38,20 2,20 2,25 38,25 38,30 2,30 2,35 38,35 33,35 33,5 28,5 28,35 23,35 23,5 18,5 18,35 13,35 13,5 8,5 8,35' /><path d='M01.5,4.5 1.5,35.5 38.5,35.5 38.5,4.5Z' stroke-width='3'/><path d='M${left},${top} ${left + 5},${top} ${left + 5},${top + 5} ${left},${top + 5}Z' fill='%23d00' /></g></svg>")`;
    } else {
      this.style.backgroundImage = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><g stroke='%23111' stroke-width='1' fill='none'><path d='M2,5 38,5 38,10 2,10Z' fill='%23aaa' /><path d='M2,5 38,5 38,10 2,10 2,15 38,15 38,20 2,20 2,25 38,25 38,30 2,30 2,35 38,35 33,35 33,5 28,5 28,35 23,35 23,5 18,5 18,35 13,35 13,5 8,5 8,35' /><path d='M01.5,4.5 1.5,35.5 38.5,35.5 38.5,4.5Z' stroke-width='3'/></g></svg>")`;
    }
  });
});

// Add coloration to calendar icon in date form when the dates already have a value (On results page)
if(dateInputs){
  dateInputs.forEach(function (input) {
    if (/^[0-9]{4}\-[0-9]{2}\-[0-9]{2}$/.exec(input.value)) {
      const day = parseInt(input.value.substring(8, 12));
      const top = Math.floor((day - 1) / 7) * 5 + 10;
      const left = ((day - 1) % 7) * 5 + 3;
      input.style.backgroundImage = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><g stroke='%23111' stroke-width='1' fill='none'><path d='M2,5 38,5 38,10 2,10Z' fill='%23e9a' /><path d='M2,5 38,5 38,10 2,10 2,15 38,15 38,20 2,20 2,25 38,25 38,30 2,30 2,35 38,35 33,35 33,5 28,5 28,35 23,35 23,5 18,5 18,35 13,35 13,5 8,5 8,35' /><path d='M01.5,4.5 1.5,35.5 38.5,35.5 38.5,4.5Z' stroke-width='3'/><path d='M${left},${top} ${left + 5},${top} ${left + 5},${top + 5} ${left},${top + 5}Z' fill='%23d00' /></g></svg>")`;
    } else {
      input.style.backgroundImage = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><g stroke='%23111' stroke-width='1' fill='none'><path d='M2,5 38,5 38,10 2,10Z' fill='%23aaa' /><path d='M2,5 38,5 38,10 2,10 2,15 38,15 38,20 2,20 2,25 38,25 38,30 2,30 2,35 38,35 33,35 33,5 28,5 28,35 23,35 23,5 18,5 18,35 13,35 13,5 8,5 8,35' /><path d='M01.5,4.5 1.5,35.5 38.5,35.5 38.5,4.5Z' stroke-width='3'/></g></svg>")`;
    }
  });
}


// When the user clicks on the button, scroll to the top of the document
function topFunction() {
  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}

// Alert for sites that have inaccurate dates
function dateInfo(){
  alert("Date search results may be inaccurate for this site");
}




/**************************************
Load Tippy tool tips with custom option
****************************************/
// tippy(".headline", {
//   delay: [400, 200],
//   duration: [400, 100],
//   theme: "google",
//   arrow: true,
//   arrowType: "round"
// });