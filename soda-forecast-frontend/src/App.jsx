import React from 'react';
import StateList from './StateList';
import EmailForm from './EmailForm'; // Your contact form component
import './App.css'; // Your main CSS file

function App() {
  return (
    <div className="App">
      <StateList />
      <EmailForm />
    </div>
  );
}

export default App;
