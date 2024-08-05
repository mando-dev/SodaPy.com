"use client";
import styles from "../styles/StateList.module.css";
import dynamic from 'next/dynamic';

const state = "Texas";

// Lazy load EmailForm component to improve initial load time
const EmailForm = dynamic(() => import('../components/EmailForm'), {
  ssr: false, // Disable server-side rendering for this component
});

const StateList = ({ initialData }) => {
  return (
    <div className={styles.stateListContainer}>
      <h3>
        I donated my kidney to my father. Soda is the number one contributor to Kidney Failure.
      </h3>
      <h1 className={styles.title}>Soda Consumption Predictions</h1>
      <h2 className={styles.title2}>in Real Time (forecasting next year)</h2>
      <div className={styles.stateListItem}>
        {state}: {initialData[state] === "refresh your browser" ? 
          "refresh your browser" : 
          initialData[state] || "Loading..."}
      </div>
      <footer className={styles.footer}>Powered by Gemini API</footer>
      <EmailForm />
    </div>
  );
};

export const getStaticProps = async () => {
  try {
    const predictionData = await fetchStateData();
    return { props: { initialData: predictionData } };
  } catch (error) {
    console.error("Error fetching prediction data:", error);
    return {
      props: { initialData: { [state]: "refresh your browser" } }, // Fallback data
    };
  }
};

export default StateList;

async function fetchStateData(forceRefresh = false) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/prediction?state=${encodeURIComponent(state)}&force_refresh=${forceRefresh}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    const result = await response.json();
    return { [state]: result[state] || "refresh your browser" };
  } catch (error) {
    console.error("Error in fetchStateData:", error);
    throw error; // Rethrow error to handle in getStaticProps
  }
}
