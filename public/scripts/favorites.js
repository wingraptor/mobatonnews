/****************************************
Send Favorites Article IDs to Post Request
****************************************/



// document.addEventListener("DOMContentLoaded", getFavoriteArticlesFromDb);

dbReq.onsuccess = (event) => {
  db = event.target.result;
  // Read DB for list of favorited articleIDs
  getFavoriteArticlesFromDb();
};

// Read DB for list of stored favorite articleIDs
function getFavoriteArticlesFromDb() {
  // Create a transaction
  let tx = db.transaction(["favoriteArticles"], "readonly");
  let store = tx.objectStore("favoriteArticles");

  let req = store.openCursor();
  let favoriteArticles = [];

  // Listen for completion of event (opening tx, acccessing store and opening cursor) and execute corresponding function
  req.onsuccess = function (event) {
    // IDBCursor containing the key (index in this case) from the DB as well as the value articleIdFromDb as it's value
    let cursor = event.target.result;
    if (cursor != null) {
      // Compare  articleIdsFromPage to articleIdsFromFavoritesStore and push to array
      favoriteArticles.push(cursor.value.id);
      // Proceed to next articleIdFromDB key-value pair
      cursor.continue();
    } else {
      // Convert data from the form ["articleID", "articleID", "articleID"] to {index: articleID, index:articleID}
      let obj = favoriteArticles.reduce(function (
        accumulator,
        articleID,
        currentIndex
      ) {
        accumulator[currentIndex] = articleID;
        return accumulator;
      },
      {});

      // 
      sendFavoriteArticlesToServer(obj).then((data) => {
        console.log(data);
      });
    }
  };

  req.onerror = (event) =>
    alert("error in cursor request " + event.target.errorCode);
}

async function sendFavoriteArticlesToServer(favoriteArticles) {
  const response = await fetch("/favorites", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(favoriteArticles),
  });
  return response.json();
}
