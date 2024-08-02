## SodaPy.com

First you will load the these two files in the root directory:

FILE 1
Xgboost_model_tuned.json

FILE 2
Arima_model.pkl


Then you will load this file in the backend folder.

FILE 
Sodapy-96607d34a36f.json

Then you will create a docker image/container to run the backend file ‘app.py’ from the backend folder. 

While the backend is running you will run ‘npm run build’ from the root directory which will create an ‘out’ folder. Copy this ‘out’ folders’ files to the static folder in the backend folder. 

Then run ‘npm run dev’ at root directory to run the frontend. 

There should be two ‘.env’ files: one at root and one at backend folder.

Thats it. 





## Project Overview
You gotta  have two .env files. One in the root directory and one inside the backend folder. You also need a json key to authenticate into using Vertex AI API of my fine tuned model of Gemini. I can send you the key privately or generate one for you. But name of my current key file is “JSON key file” that is stored inside the backend folder. Then you an run both backend and frontend server in development. To run frontend from root, you run “npm run dev”, and from backend folder you run “docker run -p 8080:8080 sodapy”  Dockerfle is located inside backend folder. Checkout the requirements.txt  to see dependencies/installments. 

build image then docker run the npm run build then copy all files to satic foder   cp -r out/* backend/static/





This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).







## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
