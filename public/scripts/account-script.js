/******************************************************************
Alert Frequency fields are only selectable when user has selected  ->
Yes to subscribe for email alerts.
*******************************************************************/

// Get user's current subscription status sent from server
// Select radio field
let subscribeFields = document.querySelectorAll("input[name=subscribe]");

// Select Alert Frequency Fields
let alertFreqFields = document.querySelectorAll("input[name=frequency]");

// Get field which is currently selected
let checkedField = [...subscribeFields].filter(
  (field) => field.checked === true
)[0];

if (checkedField.getAttribute("value") === "false") {
  alertFreqFields.forEach((field) => (field.disabled = true));
}

// Handles when user (using a browser) changes Subscribe to Email state by clicking radio button
function getCheckedValue(clickedFreqField) {
  let checkedField = clickedFreqField;
  console.log(checkedField.getAttribute("value"));
  if (checkedField.getAttribute("value") === "false") {
    alertFreqFields.forEach((field) => (field.disabled = true));
  } else {
    alertFreqFields.forEach((field) => {
      field.disabled = false;
      // Set default frequency value to 30min
      if(field.value === "30min"){
        field.checked = true;
      }
    });
  }
}
