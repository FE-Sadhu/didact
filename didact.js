import Didact from "./index.js";

// const jsx = (
//   <div style="background: salmon">
//     <h1>Hello World</h1>
//     <h2 style="text-align:right">from Didact</h2>
//   </div>
// );

const element = Didact.createElement(
  'div', {
  style: "background: lightgreen",
  },
  Didact.createElement('h1', null, 'Hello World'),
  Didact.createElement('h2', {
    style: "text-align:right"
  }, 'from Didact'),
)

const container = document.getElementById('root');
Didact.render(element, container);