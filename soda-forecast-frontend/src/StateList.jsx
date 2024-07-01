import React, { useEffect, useState } from 'react';
import './StateList.css';

function StateList() {
  const [data, setData] = useState({});

  const fetchPredictionForState = async (state, retries = 0) => {
    try {
      // Try to get from localStorage first
      const cachedPrediction = localStorage.getItem(state);
      if (cachedPrediction) {
        return { state, prediction: cachedPrediction };
      }

      const response = await fetch(`http://127.0.0.1:5000/prediction?state=${encodeURIComponent(state)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      const prediction = result[state];

      // Store the prediction in localStorage
      localStorage.setItem(state, prediction);

      return { state, prediction };
    } catch (error) {
      console.error(`Error fetching data for ${state}:`, error);
      if (retries < 5) {
        await new Promise(res => setTimeout(res, 2000));
        return await fetchPredictionForState(state, retries + 1);
      } else {
        // Fall back to a default value or the last known good value
        const fallbackValue = localStorage.getItem(state) || '20.0';
        return { state, prediction: fallbackValue };
      }
    }
  };

  const fetchAllPredictions = async () => {
    const states = [
      'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California',
      'Colorado', 'Connecticut', 'Delaware', 'Florida',
      'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
      'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts',
      'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska',
      'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
      'North Carolina', 'North Dakota', 'Ohio',
      'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island',
      'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
      'Virginia', 'Washington', 'West Virginia', 'Wisconsin',
      'Wyoming'
    ];

    const results = await Promise.all(states.map(state => fetchPredictionForState(state)));
    const newData = results.reduce((acc, { state, prediction }) => {
      acc[state] = prediction;
      return acc;
    }, {});
    setData(newData);
  };

  useEffect(() => {
    fetchAllPredictions();
    const intervalId = setInterval(fetchAllPredictions, 3600000); // Refresh every hour (3600000 ms)

    return () => clearInterval(intervalId); // Clean up on component unmount
  }, []);

  const columns = 3;
  const rowsPerColumn = Math.ceil(Object.keys(data).length / columns);
  const stateColumns = Array.from({ length: columns }, (_, i) => Object.keys(data).slice(i * rowsPerColumn, (i + 1) * rowsPerColumn));

  return (
    <div className="state-list-container">
      <h3>This app is to help prevent Kidney Failure. I donated my kidney to my father and I don't want other people to go through the same surgery. By identifying where soda consumption is highest, we can request anonymous/voluntary urine tests to identify Stage 1 Kidney Failure: killing the problem at its root. High Fructose Corn Syrup (found much in soda) is the number one contributor to Kidney Failure.</h3>
      <h1 className="title">Soda Consumption Predictions</h1>
      <h2 className="title2">in real-time (Updates Every Hour)</h2>
      <div className="state-list-columns">
        {stateColumns.map((column, colIndex) => (
          <ul key={colIndex} className="state-list">
            {column.map((state) => (
              <li key={state}>
                {state}: {data[state] ? `${data[state]}%` : 'Loading...'}
              </li>
            ))}
          </ul>
        ))}
      </div>
      <footer className="footer">Powered by Gemini</footer>
    </div>
  );
}

export default StateList;
