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

darkModeButton.addEventListener("click", function() {
  localStorage.setItem(
    "mode",
    (localStorage.getItem("mode") || "dark-mode") === "dark-mode"
      ? "light-mode"
      : "dark-mode"
  );
  if (localStorage.getItem("mode") === "dark-mode") {
    document.querySelector("body").classList.remove("light-mode");
    document.querySelector("body").classList.add("dark-mode");
  } else {
    document.querySelector("body").classList.remove("dark-mode");
    document.querySelector("body").classList.add("light-mode");
  }
});

document.addEventListener("DOMContentLoaded", event => {
  if (localStorage.getItem("mode") === "dark-mode") {
    document.querySelector("body").classList.remove("light-mode");
    document.querySelector("body").classList.add("dark-mode");
  } else {
    document.querySelector("body").classList.remove("dark-mode");
    document.querySelector("body").classList.add("light-mode");
  }
});

/*********************************
Handle articles that user has read - Indexed DB - https://dev.to/andyhaskell/build-a-basic-web-app-with-indexeddb-38ef?signin=true
********************************/

// Collect article IDs (this is the id record value from Archives collection) {added to a data attribute to the article card in the ejs template}
let articleCards = document.querySelectorAll(".article-card");
// Array.from property used to iterate over nodeList
let articleIdsFromPage = Array.from(articleCards, function(articleCard) {
  return articleCard.getAttribute("data-articleID");
});

// CREATE AND OPEN DB
let db;
// Open Database with the name myDatabase (version 1)
let dbReq = indexedDB.open("myDatabase", 1);

// Listen for the event when the database has been created
dbReq.onupgradeneeded = function(event) {
  // Set created DB to the db variable
  db = event.target.result;

  // Create an object store
  let articleIdsFromDb = db.createObjectStore("articleIdsFromDb", { keyPath: "id" });
};

// If DB was alread created, listen for success opening of DB and store to the db variable
dbReq.onsuccess = function(event){
  db = event.target.result;
  // Read DB for list of stored articleIDs
  collectArticleIdsFromDb(db, articleIdsFromPage);
}

// Listen for error response from dbReq function
dbReq.onerror = function(event) {
  alert("error opening database" + event.target.errorCode);
}

// Read DB for list of stored articleIDs
function collectArticleIdsFromDb(db, articleIdsFromPage) {
  // Create a transaction
  let tx = db.transaction(["articleIdsFromDb"], "readonly");
  let store = tx.objectStore("articleIdsFromDb");

  let req = store.openCursor();
  let matchedArticleIds = [];

  // Listen for completion of event (opening tx, acccessing store and opening cursor) and execute corresponding function
  req.onsuccess = function(event) {
    // IDBCursor containing the key (index in this case) from the DB as well as the value articleIdFromDb as it's value
    let cursor = event.target.result;
    // console.log(cursor.value.text);
    if (cursor != null) {
      // Compare  articleIdsFromPage to articleIdsFromDb and push to array
      articleIdsFromPage.forEach(function(articleID) {
        if (articleID === cursor.value.id) {
          matchedArticleIds.push(cursor.value.id);
        }
      });
      // Proceed to next articleIdFromDB key-value pair  
      cursor.continue();
    } else {
      // Fade articles from page whose ID match the articleIdsFromDb
      fadeArticleCard(matchedArticleIds);
    }
  };

  req.onerror = function(event) {
    alert("error in cursor request " + event.target.errorCode);
  };
}

// Take array of articleIDs that are in the DB and hide them from the page
function fadeArticleCard(articleCardIds) {
  articleCardIds.forEach(function(id) {
    let articleCard = document.querySelector(
      `.article-card[data-articleID="${id}"]`
    );
    // displayToggle(articleCard); 
    articleCard.style.filter = "grayscale(100%)";
  });
}

// On click of link to article, add the article card ID to the DB
function submitArticleId(element) {
  // Get data-articleID value from the article-card ancestor of the clicked anchor element
  let articleIdFromPage = element.closest(".article-card").getAttribute("data-articleID");
  addArticleId(db, articleIdFromPage);
}

function addArticleId(db, articleIdFromPage){
  let tx = db.transaction(["articleIdsFromDb"], "readwrite");
  let store = tx.objectStore("articleIdsFromDb");

  let articleId = {id: articleIdFromPage, timestamp: Date.now()};

  // Check whtether the articleIdFromPage is already in the DB
  if (store.get(articleIdFromPage)) store.add(articleId);

  tx.oncomplete = function(){
   // On addition of article card ID to DB, fade out the article card
    // --> converted to array to utilise the fadeArticle function
    fadeArticleCard(articleIdFromPage.split(" "));
  }
}

/**************************************** 
Handle Toggler To Show/Hide More Articles  
****************************************/

// //Select all togglers on page
// let togglers = document.querySelectorAll(".articles-toggler");

// togglers.forEach(function(toggler) {
//   //Add click event listener to all togglers
//   toggler.addEventListener("click", function() {
//     //Select all hidden article items for the specifically clicked toggler
//     let hiddenItems = document.querySelectorAll(
//       `.list-hidden--${this.getAttribute("data-website")}`
//     );
//     //Make changes for all selected hidden article items
//     hiddenItems.forEach(function(hiddenItem) {
//       if (hiddenItem.style.display === "none") {
//         // Make hidden article item visible
//         hiddenItem.style.display = "flex";
//         // Change text of p element (first child of toggler element) to 'less'
//         toggler.firstChild.textContent = "Less";
//         //Change down arrow of arrow in toggler element to up
//         toggler.firstChild.nextSibling.classList = "fas fa-arrow-up";
//       } else {
//         // Remove article item from page
//         hiddenItem.style.display = "none";
//         // Change text of p element (first child of toggler element) to 'more'
//         toggler.firstChild.textContent = "More";
//         //Change down arrow of arrow in toggler element to down
//         toggler.firstChild.nextSibling.classList = "fas fa-arrow-down";
//       }
//     });
//   });
// });

/**************************************************
Handle Toggler To Share Articles
**************************************************/

// Select all article info togglers on page
let shareDivButton = document.querySelectorAll(".share-div-button");
// let hideShareDivButton = document.querySelectorAll(".hide-share-button");

function displayToggle(element, time) {
  if (element.classList.contains("hidden")) {
    setTimeout(function() {
      element.classList.remove("hidden");
    }, time);
    setTimeout(function() {
      element.classList.remove("visuallyHidden");
    }, time);
  } else {
    element.classList.add("visuallyHidden");
    element.addEventListener(
      "transitionend",
      function(e) {
        element.classList.add("hidden");
      },
      {
        capture: false,
        once: true,
        passive: false
      }
    );
  }
}

// Check to make sure button is on page
if (shareDivButton.length > 0) {
  // Add event listener to all article info. toggler
  shareDivButton.forEach(function(shareButton) {
    shareButton.addEventListener("click", function() {
      // Get articleID of corresponding article
      let articleID = this.getAttribute("data-articleID"),
        // Select corresponding div containing links to share article
        shareDiv = document.querySelector(
          `.article-share-div[data-articleID="${articleID}"]`
        ),
        footerDiv = document.querySelector(
          `.article-card-info-div[data-articleID="${articleID}"]`
        );
      displayToggle(footerDiv, 300);
      displayToggle(shareDiv, 300);
    });
  }, false);
}

// // Check to make sure button is on page
// if (hideShareDivButton.length > 0) {
//   // Add event listener to all article info. toggler
//   hideShareDivButton.forEach(function(hideShareDivButton) {
//     hideShareDivButton.addEventListener("click", function() {
//       // Get articleID of corresponding article
//       let articleID = this.getAttribute("data-articleID"),
//         // Select corresponding div containing links to share article
//         shareDiv = document.querySelector(
//           `.article-share-div[data-articleID="${articleID}"]`
//         ),
//         footerDiv = document.querySelector(
//           `.article-card-info-div[data-articleID="${articleID}"]`
//         );
//       // Hide Share Div
//       displayToggle(shareDiv, 1);
//       // Display Footer Div
//       displayToggle(footerDiv, 300);
//     });
//   }, false);
// }

/***********************************
Strike through clicked article links; cannot use a:visited pseudo-class :- http://bit.ly/2D3B6K9 
************************************/
// let links = document.querySelectorAll(".headline");
// links.forEach(function(link) {
//   link.addEventListener("click", function() {
//     this.style.textDecoration = "line-through";
//   });
// });

/************************************************

Change color of Selected Elements On Page Scroll - https://pqina.nl/blog/applying-styles-based-on-the-user-scroll-position-with-smart-css/

***********************************************/

// The debounce function receives our function as a parameter
const debounce = fn => {
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
Set Max Date of End Date Form Field to Current Date
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
  document.querySelector("#startDate").addEventListener("input", function() {
    endDate.setAttribute("min", this.value);
  });
}

/*****************************************
Forms
****************************************/

// Date Input styling --> https://codepen.io/alvaromontoro/pen/YzXNjwm
let dateInputs = document.querySelectorAll("input[type='date']");

dateInputs.forEach(function(input) {
  input.addEventListener("input", function() {
    if (/^[0-9]{4}\-[0-9]{2}\-[0-9]{2}$/.exec(this.value)) {
      const day = parseInt(this.value.substring(8, 12));
      const top = Math.floor((day - 1) / 7) * 5 + 10;
      const left = ((day - 1) % 7) * 5 + 3;
      this.style.backgroundImage = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><g stroke='%23111' stroke-width='1' fill='none'><path d='M2,5 38,5 38,10 2,10Z' fill='%23e9a' /><path d='M2,5 38,5 38,10 2,10 2,15 38,15 38,20 2,20 2,25 38,25 38,30 2,30 2,35 38,35 33,35 33,5 28,5 28,35 23,35 23,5 18,5 18,35 13,35 13,5 8,5 8,35' /><path d='M01.5,4.5 1.5,35.5 38.5,35.5 38.5,4.5Z' stroke-width='3'/><path d='M${left},${top} ${left +
        5},${top} ${left + 5},${top + 5} ${left},${top +
        5}Z' fill='%23d00' /></g></svg>")`;
    } else {
      this.style.backgroundImage = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><g stroke='%23111' stroke-width='1' fill='none'><path d='M2,5 38,5 38,10 2,10Z' fill='%23aaa' /><path d='M2,5 38,5 38,10 2,10 2,15 38,15 38,20 2,20 2,25 38,25 38,30 2,30 2,35 38,35 33,35 33,5 28,5 28,35 23,35 23,5 18,5 18,35 13,35 13,5 8,5 8,35' /><path d='M01.5,4.5 1.5,35.5 38.5,35.5 38.5,4.5Z' stroke-width='3'/></g></svg>")`;
    }
  });
});

// Add coloration to calendar icon in date form when the dates already have a value (On results page)
if (dateInputs) {
  dateInputs.forEach(function(input) {
    if (/^[0-9]{4}\-[0-9]{2}\-[0-9]{2}$/.exec(input.value)) {
      const day = parseInt(input.value.substring(8, 12));
      const top = Math.floor((day - 1) / 7) * 5 + 10;
      const left = ((day - 1) % 7) * 5 + 3;
      input.style.backgroundImage = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><g stroke='%23111' stroke-width='1' fill='none'><path d='M2,5 38,5 38,10 2,10Z' fill='%23e9a' /><path d='M2,5 38,5 38,10 2,10 2,15 38,15 38,20 2,20 2,25 38,25 38,30 2,30 2,35 38,35 33,35 33,5 28,5 28,35 23,35 23,5 18,5 18,35 13,35 13,5 8,5 8,35' /><path d='M01.5,4.5 1.5,35.5 38.5,35.5 38.5,4.5Z' stroke-width='3'/><path d='M${left},${top} ${left +
        5},${top} ${left + 5},${top + 5} ${left},${top +
        5}Z' fill='%23d00' /></g></svg>")`;
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
function dateInfo() {
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
