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