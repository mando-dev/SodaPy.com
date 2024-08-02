"use client";
import Image from "next/image";
import styles from "../styles/StateList.module.css";
import EmailForm from "../components/EmailForm";
import { useEffect, useState } from "react";

const states = ["Texas"];

const fetchPredictionForState = async (state, retries = 0) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/prediction?state=${encodeURIComponent(state)}`, { timeout: 10000 });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    const prediction = result[state];

    if (prediction === "No percentage found" || (prediction && prediction.length === 4 && /^\d{4}$/.test(prediction))) {
      if (retries < 5) {
        await new Promise((res) => setTimeout(res, 2000)); // Add a delay before retrying
        return await fetchPredictionForState(state, retries + 1);
      } else {
        return { state, prediction: "next hour" };
      }
    } else {
      return { state, prediction: prediction.includes('%') ? prediction : `${prediction}%` };
    }
  } catch (error) {
    if (retries < 5) {
      await new Promise((res) => setTimeout(res, 2000)); // Add a delay before retrying
      return await fetchPredictionForState(state, retries + 1);
    } else {
      return { state, prediction: "Loading..." };
    }
  }
};

// Common Function to be Used to fetch all the prediction data of state
async function fetchStateData() {
  const newData = await Promise.all(
    states.map(async (state) => {
      return await fetchPredictionForState(state);
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
      <Image
        src="/profile-pic.jpg"
        alt="Profile Picture"
        width={250}
        height={250}
        priority={true}
        className={styles.profilePic}
      />
      <h3 className={styles.specificText}>
        I donated my kidney to my father.<br /> Soda is the number one contributor to Kidney Failure.
      </h3>
      <h1 className={styles.title}>Soda Consumption Predictions</h1>
      <h2 className={styles.title2}>in Real Time (every month)</h2>
      <div className={styles.stateListColumns}>
        <div className={styles.stateListColumn}>
          {states.map((state) => (
            <div key={state} className={styles.stateListItem}>
              {state}: {data[state] || "Loading..."}
            </div>
          ))}
        </div>
      </div>
      <footer className={styles.footer}>Powered by Gemini API</footer>
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
