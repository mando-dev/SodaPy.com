"use client";
import styles from "../styles/StateList.module.css";
import EmailForm from "../components/EmailForm";
import { useEffect, useState } from "react";

const state = "Texas";

const fetchPredictionForState = async (retries = 0, forceRefresh = false) => {
  try {
    console.log(`Fetching prediction for ${state}`);
    const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/prediction?state=${encodeURIComponent(state)}&force_refresh=${forceRefresh}`;
    const response = await fetch(url, { timeout: 10000 });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    console.log(`Result for ${state}:`, result);
    const prediction = result[state];

    if (prediction === "refresh your browser") {
      return { state, prediction: "refresh your browser" };
    } else {
      return { state, prediction: `${prediction}%` };
    }
  } catch (error) {
    console.error(`Error fetching data for ${state}:`, error);
    if (retries < 10) {
      await new Promise((res) => setTimeout(res, 2000)); // Add a delay before retrying
      return await fetchPredictionForState(retries + 1, forceRefresh);
    } else {
      return { state, prediction: "refresh your browser" };
    }
  }
};

async function fetchStateData(forceRefresh = false) {
  const { state, prediction } = await fetchPredictionForState(0, forceRefresh);
  return { [state]: prediction };
}

const StateList = ({ initialData }) => {
  const [data, setData] = useState(initialData);

  const refreshData = async () => {
    const predictionData = await fetchStateData(true);
    setData(predictionData);
  };

  useEffect(() => {
    const fetchData = async () => {
      const predictionData = await fetchStateData();
      setData(predictionData);
    };
    fetchData(); // Fetch data initially when component mounts
  }, []);

  return (
    <div className={styles.stateListContainer}>
      <h3>
        I donated my kidney to my father. Soda is the number one contributor to Kidney Failure.
      </h3>
      <h1 className={styles.title}>Soda Consumption Predictions</h1>
      <h2 className={styles.title2}>in Real Time (forecasting next year)</h2>
      <div className={styles.stateListItem}>
        {state}: {data[state] === "refresh your browser" ? 
          "refresh your browser" : 
          data[state] || "Loading..."}
      </div>
      <footer className={styles.footer}>Powered by Gemini API</footer>
      <EmailForm />
    </div>
  );
};

export const getStaticProps = async () => {
  const predictionData = await fetchStateData(true); // Force refresh on initial load
  return { props: { initialData: predictionData } };
};

export default StateList;
