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