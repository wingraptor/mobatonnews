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
    themeName.innerHTML = "Dark Mode"; 
  } else {
    darkModeButton.classList.remove("fa-moon");
    darkModeButton.classList.add("fa-sun");
    body.classList.remove("light-mode");
    body.classList.add("dark-mode");
    themeName.innerHTML = "Light Mode"; 
  }
});

// Check users preferred them and apply on DOM loading
document.addEventListener("DOMContentLoaded", (event) => {
  if (localStorage.getItem("mode") === "light-mode") {
    darkModeButton.classList.add("fa-moon");
    darkModeButton.classList.remove("fa-sun");
    body.classList.remove("dark-mode");
    body.classList.add("light-mode");
    themeName.innerHTML = "Dark Mode"; 
  } else {
    darkModeButton.classList.add("fa-sun");
    darkModeButton.classList.remove("fa-moon");
    body.classList.remove("light-mode");
    body.classList.add("dark-mode");
    themeName.innerHTML = "Light Mode"; 
  }
});

/*********************************
Handle articles that user has read - Indexed DB - https://dev.to/andyhaskell/build-a-basic-web-app-with-indexeddb-38ef?signin=true
********************************/

// Collect article IDs (this is the id record value from Archives collection) {added to a data attribute to the article card in the ejs template}
let articleCards = document.querySelectorAll(".article-card");
// Array.from property used to iterate over nodeList
let articleIdsFromPage = Array.from(articleCards, (articleCard) => {
  return articleCard.getAttribute("data-articleID");
});

// CREATE AND OPEN DB
let db;
// Open Database with the name myDatabase (version 1)
let dbReq = indexedDB.open("myDatabase", 1);

// Listen for the event when the database has been created
dbReq.onupgradeneeded = (event) => {
  // Set created DB to the db variable
  db = event.target.result;

  // Create an object store
  let articleIdsFromDb = db.createObjectStore("articleIdsFromDb", {
    keyPath: "id",
  });
};

// If DB was alread created, listen for success opening of DB and store to the db variable
dbReq.onsuccess = (event) => {
  db = event.target.result;
  // Read DB for list of stored articleIDs
  readViewedArticlesFromDb(db, articleIdsFromPage);
};

// Listen for error response from dbReq function
dbReq.onerror = (event) =>
  alert("error opening database" + event.target.errorCode);

// Read DB for list of stored articleIDs
function readViewedArticlesFromDb(db, articleIdsFromPage) {
  // Create a transaction
  let tx = db.transaction(["articleIdsFromDb"], "readonly");
  let store = tx.objectStore("articleIdsFromDb");

  let req = store.openCursor();
  let matchedArticleIds = [];

  // Listen for completion of event (opening tx, acccessing store and opening cursor) and execute corresponding function
  req.onsuccess = function (event) {
    // IDBCursor containing the key (index in this case) from the DB as well as the value articleIdFromDb as it's value
    let cursor = event.target.result;
    // console.log(cursor.value.text);
    if (cursor != null) {
      // Compare  articleIdsFromPage to articleIdsFromDb and push to array
      articleIdsFromPage.forEach((articleID) => {
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

  req.onerror = (event) =>
    alert("error in cursor request " + event.target.errorCode);
}

// Take array of articleIDs that are in the DB and fade them from the page (used to show that article has been read)
function fadeArticleCard(articleCardIds) {
  articleCardIds.forEach(function (id) {
    let articleCard = document.querySelector(
      `.article-card[data-articleID="${id}"]`
    );
    // displayToggle(articleCard);
    articleCard.style.filter = "grayscale(100%)";
  });
}

// **Called from HTML itself** On click of link to article, add the article card ID to the DB
function submitArticleId(element) {
  // Get data-articleID value from the article-card ancestor of the clicked anchor element
  let articleIdFromPage = element
    .closest(".article-card")
    .getAttribute("data-articleID");
  addArticleId(articleIdFromPage);
}

function addArticleId(articleIdFromPage) {
  let tx = db.transaction(["articleIdsFromDb"], "readwrite");
  let store = tx.objectStore("articleIdsFromDb");

  let articleId = { id: articleIdFromPage, timestamp: Date.now() };

  let req = store.get(articleIdFromPage);

  req.onsuccess = (event) => {
    let articleIdObject = event.target.result;

    if (!articleIdObject) {
      store.add(articleId);
    } else {
      return;
    }
  };

  // Handle errors getting articles from the database
  req.onerror = (event) => {
    alert(
      "Error adding or removing viewed article from DB" + event.target.errorCode
    );
  };

  tx.oncomplete = function () {
    // On addition of article card ID to DB, fade out the article card
    // --> converted to array to utilise the fadeArticle function
    fadeArticleCard(articleIdFromPage.split(" "));
  };
}

/********************************
Handle Favorites Article
*********************************/

let favoritesButtons = document.querySelectorAll(".favorite-button");

favoritesButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    let obj = {};
    // Select parent element of the button with the class .article-card-footer
    let article = button.closest(".article-card-footer");
    // Grab ID of article from the selected parent element
    let articleId = article.getAttribute("data-articleid");
    let fetchMethod;

    // Set Method for fetch request depending on button: fas = saved; far = not saved
    if (button.classList.contains("fas")) {
      fetchMethod = "DELETE";
    } else {
      fetchMethod = "POST";
    }

    // Send data to backend in the form {articleId: "articleId"}
    obj.articleId = articleId;

    postFavoriteArticleToDb(obj, fetchMethod)
      .then((data) => {
        if (!data.error) {
          toggleStarButton(button, data.message);
        } else {
          alert(data.message);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  });
});

async function postFavoriteArticleToDb(articleId, fetchMethod) {
  const response = await fetch("/favorites", {
    method: fetchMethod,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(articleId),
  });
  return response.json();
}

// Toggle between filled star and outline star (saved and not saved article)
function toggleStarButton(button, alertMessage) {
  let buttonClasses = button.classList;
  if (buttonClasses.contains("fas")) {
    if (alertMessage) {
      alert(alertMessage);
    }
    buttonClasses.remove("fas");
    buttonClasses.add("far");
  } else {
    if (alertMessage) {
      alert(alertMessage);
    }
    buttonClasses.remove("far");
    buttonClasses.add("fas");
  }
}
/**************************************************
Handle Toggler To Share Articles
**************************************************/

// Select all article info togglers on page
let shareDivButton = document.querySelectorAll(".share-div-button");
// let hideShareDivButton = document.querySelectorAll(".hide-share-button");

function displayToggle(element, time) {
  if (element.classList.contains("hidden")) {
    setTimeout(function () {
      element.classList.remove("hidden");
    }, time);
    setTimeout(function () {
      element.classList.remove("visuallyHidden");
    }, time);
  } else {
    element.classList.add("visuallyHidden");
    element.addEventListener(
      "transitionend",
      function (e) {
        element.classList.add("hidden");
      },
      {
        capture: false,
        once: true,
        passive: false,
      }
    );
  }
}
/***********************
Handle Subscribe Button
************************/

// Select subscribe button
const button = document.querySelector("#subscribe-button");

button.addEventListener("click", (event) => {
  const emailAddress = document.querySelector("#email-field").value;
  const frequency = document.querySelector("#subscribe-frequency-field").value;
  const obj = { emailAddress, frequency };

  subscribe(obj)
    .then((response) => alert(response.message))
    .catch((error) => alert(error));
});

async function subscribe(obj) {
  const response = await fetch("/subscribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(obj),
  });

  return response.json();
}

// Check to make sure button is on page
if (shareDivButton.length > 0) {
  // Add event listener to all article info. toggler
  shareDivButton.forEach(function (shareButton) {
    shareButton.addEventListener("click", function () {
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
      this.style.backgroundImage = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><g stroke='%23111' stroke-width='1' fill='none'><path d='M2,5 38,5 38,10 2,10Z' fill='%23e9a' /><path d='M2,5 38,5 38,10 2,10 2,15 38,15 38,20 2,20 2,25 38,25 38,30 2,30 2,35 38,35 33,35 33,5 28,5 28,35 23,35 23,5 18,5 18,35 13,35 13,5 8,5 8,35' /><path d='M01.5,4.5 1.5,35.5 38.5,35.5 38.5,4.5Z' stroke-width='3'/><path d='M${left},${top} ${
        left + 5
      },${top} ${left + 5},${top + 5} ${left},${
        top + 5
      }Z' fill='%23d00' /></g></svg>")`;
    } else {
      this.style.backgroundImage = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><g stroke='%23111' stroke-width='1' fill='none'><path d='M2,5 38,5 38,10 2,10Z' fill='%23aaa' /><path d='M2,5 38,5 38,10 2,10 2,15 38,15 38,20 2,20 2,25 38,25 38,30 2,30 2,35 38,35 33,35 33,5 28,5 28,35 23,35 23,5 18,5 18,35 13,35 13,5 8,5 8,35' /><path d='M01.5,4.5 1.5,35.5 38.5,35.5 38.5,4.5Z' stroke-width='3'/></g></svg>")`;
    }
  });
});

// Add coloration to calendar icon in date form when the dates already have a value (On results page)
if (dateInputs) {
  dateInputs.forEach(function (input) {
    if (/^[0-9]{4}\-[0-9]{2}\-[0-9]{2}$/.exec(input.value)) {
      const day = parseInt(input.value.substring(8, 12));
      const top = Math.floor((day - 1) / 7) * 5 + 10;
      const left = ((day - 1) % 7) * 5 + 3;
      input.style.backgroundImage = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><g stroke='%23111' stroke-width='1' fill='none'><path d='M2,5 38,5 38,10 2,10Z' fill='%23e9a' /><path d='M2,5 38,5 38,10 2,10 2,15 38,15 38,20 2,20 2,25 38,25 38,30 2,30 2,35 38,35 33,35 33,5 28,5 28,35 23,35 23,5 18,5 18,35 13,35 13,5 8,5 8,35' /><path d='M01.5,4.5 1.5,35.5 38.5,35.5 38.5,4.5Z' stroke-width='3'/><path d='M${left},${top} ${
        left + 5
      },${top} ${left + 5},${top + 5} ${left},${
        top + 5
      }Z' fill='%23d00' /></g></svg>")`;
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

function showFilters(element) {
  let filters = document.querySelectorAll(".filter");
  filters.forEach(function (filter) {
    displayToggle(filter);
  });
}
