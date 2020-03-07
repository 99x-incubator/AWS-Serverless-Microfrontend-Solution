import React from "react";
import logo from "./logo.svg";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import * as ReactBootstrap from 'react-bootstrap';

function App() {
  return (
    /* <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div> */

    <div className="App">
      <header className="App-Header">
        <h1>AWS Serverless</h1>
      </header>
      <ReactBootstrap.ButtonToolbar class ="btn-toolbar">
        <ReactBootstrap.Button variant="primary">html</ReactBootstrap.Button>
        <ReactBootstrap.Button variant="primary">angular</ReactBootstrap.Button>
      </ReactBootstrap.ButtonToolbar>
    </div>
  );
}

export default App;
