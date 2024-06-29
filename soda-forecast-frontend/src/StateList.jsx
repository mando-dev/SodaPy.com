import React, { useEffect, useState } from 'react';
import './StateList.css';

const StateList = () => {
  const [data, setData] = useState({});
  const apiBaseUrl = "http://localhost:5000";

  const fetchPredictionForState = async (state, retries = 0) => {
    try {
      console.log(`Fetching prediction for ${state}`);
      const response = await fetch(`${apiBaseUrl}/prediction?state=${encodeURIComponent(state)}`, { timeout: 10000 });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      console.log(`Result for ${state}:`, result);
      const prediction = result[state];

      if (prediction === 'No percentage found' || (prediction && prediction.length === 4 && /^\d{4}$/.test(prediction))) {
        if (retries < 5) {
          await new Promise(res => setTimeout(res, 2000)); // Add a delay before retrying
          return await fetchPredictionForState(state, retries + 1);
        } else {
          console.error(`Max retries reached for ${state}`);
          return { state, prediction: 'Loading...' };
        }
      } else {
        return { state, prediction };
      }
    } catch (error) {
      console.error(`Error fetching data for ${state}:`, error);
      if (retries < 5) {
        await new Promise(res => setTimeout(res, 2000)); // Add a delay before retrying
        return await fetchPredictionForState(state, retries + 1);
      } else {
        return { state, prediction: 'Loading...' };
      }
    }
  };

  useEffect(() => {
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

    const fetchAllPredictions = async () => {
      const results = await Promise.all(states.map(state => fetchPredictionForState(state)));
      const newData = results.reduce((acc, { state, prediction }) => {
        acc[state] = prediction;
        return acc;
      }, {});
      setData(newData);
    };

    fetchAllPredictions();
  }, []);

  const columns = 3;
  const rowsPerColumn = Math.ceil(Object.keys(data).length / columns);
  const stateColumns = Array.from({ length: columns }, (_, i) => 
    Object.keys(data).slice(i * rowsPerColumn, (i + 1) * rowsPerColumn)
  );

  return (
    <div className="state-list-container">
      <h3>This app is to help prevent Kidney Failure. I donated my kidney to my father and I don't want other people to go through the same surgery. By identifying where soda consumption is highest, we can request anonymous/voluntary urine tests to identify Stage 1 Kidney Failure: killing the problem at its root. High Fructose Corn Syrup (found much in soda) is the number one contributor to Kidney Failure.</h3>
      <h1 className="title">Soda Consumption Predictions</h1>
      <h2 className="title2">in Real Time (every 10 minutes) </h2>
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
};

export default StateList;
