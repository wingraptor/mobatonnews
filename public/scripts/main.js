/********************************************************
Border Control and Page Title Depending on Filter Choosen 
*********************************************************/
let urlArr = window.location.href.split("/"),
  pageIdentifier = urlArr[urlArr.length - 1],
  pageName = document.querySelector("#page-name");

if (pageIdentifier === "") {
  filter = document.querySelector("#recent");
  filter.style.borderColor = "var(--alt-highlight-color)";
  pageName.innerHTML = "<h2>Most Recent Articles</h2>";
} else if (pageIdentifier === "corona") {
  pageName.innerHTML = "<h2>Recent COVID-19 Articles</h2>";
  filter = document.querySelector(`#${pageIdentifier}`);
  filter.style.borderColor = "var(--alt-highlight-color)";
} else if (pageIdentifier === "daily") {
  pageName.innerHTML = `<h2>Today's Articles</h2>`;
  filter = document.querySelector(`#${pageIdentifier}`);
  filter.style.borderColor = "var(--alt-highlight-color)";
} else if (pageIdentifier === "yesterday") {
  pageName.innerHTML = `<h2>Yesterday's Articles</h2>`;
  filter = document.querySelector(`#${pageIdentifier}`);
  filter.style.borderColor = "var(--alt-highlight-color)";
}

/*********************************************************
Dark Mode Toggle -- https://flaviocopes.com/dark-mode/
***********************************************************/

let darkModeButton = document.querySelector("#dark-mode-button");
let themeName = document.querySelector("#theme-mode-name");
let body = document.querySelector("body");

darkModeButton.addEventListener("click", function () {
  localStorage.setItem(
    "mode",
    (localStorage.getItem("mode") || "dark-mode") === "dark-mode"
      ? "light-mode"
      : "dark-mode"
  );
  if (localStorage.getItem("mode") === "light-mode") {
    darkModeButton.classList.remove("fa-sun");
    darkModeButton.classList.add("fa-moon");
    body.classList.remove("dark-mode");
    body.classList.add("light-mode");
  } else {
    darkModeButton.classList.remove("fa-moon");
    darkModeButton.classList.add("fa-sun");
    body.classList.remove("light-mode");
    body.classList.add("dark-mode");
  }
});

// Check users preferred them and apply on DOM loading
document.addEventListener("DOMContentLoaded", (event) => {
  if (localStorage.getItem("mode") === "light-mode") {
    darkModeButton.classList.add("fa-moon");
    darkModeButton.classList.remove("fa-sun");
    body.classList.remove("dark-mode");
    body.classList.add("light-mode");
  } else {
    darkModeButton.classList.add("fa-sun");
    darkModeButton.classList.remove("fa-moon");
    body.classList.remove("light-mode");
    body.classList.add("dark-mode");
  }
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
  };
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
  let maxScrollHeight =
    document.documentElement.scrollHeight - window.innerHeight;
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
};

// Listen for new scroll events, here we debounce our `storeScroll` function
document.addEventListener("scroll", debounce(storeScroll));

// Update scroll position for first time
storeScroll();

/**********************************************************
Forms - Set Max Date of End Date Form Field to Current Date
*********************************************************/

// Select End Date Element
let endDate = document.getElementById("endDate");

// Generate current date in UTC format -- https://stackoverflow.com/a/35922073
let today = new Date().toISOString().slice(0, 10);

// Only when date is on element is on page
if (endDate) {
  // Set Max date Attr.
  endDate.setAttribute("max", today);

  // Ensures that endDate does not come before startDate
  document.querySelector("#startDate").addEventListener("input", function () {
    endDate.setAttribute("min", this.value);
  });
}

// When the user clicks on the button, scroll to the top of the document
function topFunction() {
  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}

// Alert for sites that have inaccurate dates
function dateInfo() {
  alert("Date search results may be inaccurate for this site");
}

function showFilters(element) {
  let filters = document.querySelectorAll(".filter");
  filters.forEach(function (filter) {
    displayToggle(filter);
  });
}
