/* 
Inspiration: 
https://dribbble.com/shots/2292415-Daily-UI-001-Day-001-Sign-Up
*/

// Redirect to a dynamic route based on input value
function join() {
  var a = document.getElementById('abc');
  window.location.href = `/${a.value}`;
}

// Redirect to a static route for creating something
function create() {
  var a = document.getElementById('abc');
  window.location.href = '/create';
}
