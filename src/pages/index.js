"use client"
import styles from "../styles/StateList.module.css";
import EmailForm from "../components/EmailForm";
import { useEffect, useState } from "react";

const states = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
];

const fetchPredictionForState = async (state, retries = 0) => {
  try {
    console.log(`Fetching prediction for ${state}`);
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/prediction?state=${encodeURIComponent(state)}`, { timeout: 10000 });
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
        return { state, prediction: 'next hour' };
      }
    } else {
      return { state, prediction: `${prediction}%` };
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

// Common Function to be Used to fetch all the prediction data of state
async function fetchStateData() {
  const newData = await Promise.all(
    states.map(async (state) => {
      return await fetchPredictionForState(state)
    })
  );

  // Collect all the data in a common object
  const dataObject = newData.reduce((acc, { state, prediction }) => {
    acc[state] = prediction;
    return acc;
  }, {});

  return dataObject;
}

const StateList = ({ initialData }) => {
  const [data, setData] = useState(initialData);

  // Fetch data after every hour from initial render
  useEffect(() => {
    const intervalId = setInterval(async () => {
      const predictionData = await fetchStateData();
      setData(predictionData);
    }, 3600000); // Refresh data every hour
    return () => clearInterval(intervalId); // Clean up interval on component unmount
  }, []);

  return (
    <div className={styles.stateListContainer}>
      <h3>
        This app is to help prevent Kidney Failure. I donated my kidney to my
        father and I don&apos;t want other people to go through the same
        surgery. By identifying where soda consumption is highest, we can kill
        the problem at its root. High Fructose Corn Syrup (found much in soda)
        is the number one contributor to Kidney Failure.
      </h3>
      <h1 className={styles.title}>Soda Consumption Predictions</h1>
      <h2 className={styles.title2}>in Real Time (every hour)</h2>
      <div className={styles.stateListColumns}>
        {states.map((state) => (
          <div key={state} className={styles.stateListItem}>
            {state}: {data[state] || "Loading..."}
          </div>
        ))}
      </div>
      <footer className={styles.footer}>Powered by Gemini</footer>
      <EmailForm />
    </div>
  );
};

export const getStaticProps = async () => {
  // Used the common function to be used in the component and for initial data load
  const predictionData = await fetchStateData();
  return { props: { initialData: predictionData } }; // Regenerate the page every 10 minutes
};

export default StateList;