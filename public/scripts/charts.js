const req = new XMLHttpRequest();
const viewButton = document.querySelector(".search-button-div");

viewButton.addEventListener("click", function(event) {
  let siteID = document.querySelector("#siteName").value;
  const url = `/insights/charts/${siteID}`;
  req.open("GET", url, true); // set this to POST if you would like
  req.addEventListener("load", onLoad);
  req.addEventListener("error", onError);
  req.send();
});



function onLoad() {
  let response = this.responseText;
  let parsedResponse = JSON.parse(response);
  let ctx = document.getElementById("myChart");
  let words = parsedResponse.reduce((arr, element) => {
    arr.push(element[0]);
    return arr;
  }, []);
  let count = parsedResponse.reduce((arr, element) => {
    arr.push(element[1]);
    return arr;
  }, []);
  


  let myChart = new Chart(ctx, {
    type: "horizontalBar",
    data: {
      labels: words,
      datasets: [
        {
          label: "Count",
          data: count,
          backgroundColor: colorArrGenerator(count.length),
          borderColor: colorArrGenerator(count.length),
          borderWidth: 1
        }
      ]
    },
    options: {
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: true
            }
          }
        ]
      }
    }
  });
  myChart.clear();
  console.log("test")
}

function onError() {
  // handle error here, print message perhaps
  console.log("error receiving async AJAX call");
}

// Generate random number between 0 and 255
function randomNum() {
  return Math.floor(Math.random() * (255 - 0 + 1)) + 0;
}
// Generates rgb string
function rgbGenerator(){
  return `rgb(${randomNum()}, ${randomNum()}, ${randomNum()})`;
}

function colorArrGenerator(length){
  let array = [];
  for (var i = 0; i <= length; i++){
    array.push(rgbGenerator());
  }
  return array;
}