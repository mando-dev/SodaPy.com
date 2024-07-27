import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';

const CACHE_FILE_PATH = path.resolve('./cache/sodaData.json');
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

const fetchDataFromAPI = async (state: string): Promise<string> => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/prediction?state=${state}`);
  return response.data[state];
};

const getCachedData = async (): Promise<{ [key: string]: string } | null> => {
  try {
    const fileStats = await fs.stat(CACHE_FILE_PATH);
    const now = new Date().getTime();
    const fileAge = now - new Date(fileStats.mtime).getTime();

    if (fileAge > CACHE_DURATION) {
      return null;
    }

    const data = await fs.readJson(CACHE_FILE_PATH);
    return data;
  } catch (error) {
    return null;
  }
};

const cacheData = async (data: { [key: string]: string }): Promise<void> => {
  await fs.ensureDir(path.dirname(CACHE_FILE_PATH));
  await fs.writeJson(CACHE_FILE_PATH, data);
};

export const getSodaData = async (states: string[]): Promise<{ [key: string]: string }> => {
  let data = await getCachedData();

  if (!data) {
    data = {};
    for (const state of states) {
      data[state] = await fetchDataFromAPI(state);
    }
    await cacheData(data);
  }

  return data;
};
