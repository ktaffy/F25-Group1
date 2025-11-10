# Mise En Place

## Client and Project
Our customers are regular people who have struggled before with preparing multiple recipes at once and want to improve their cooking skills. While cooking for one person presents its own set of difficulties, organizing multiple dishes or cooking for a large group of people presents even greater difficulties. The application called Mise en Place was created to make this procedure easier. By breaking down multiple recipes into simple, step-by-step directions, it assists users in planning and guiding them in real time through the cooking process, allowing them to concentrate on what really matters—cooking, which becomes as easy as following a minute-by-minute schedule. 

## Technical Requirements
- Frontend/UI - React Native + TypeScript (Native Mobile) 
    - Vast component library. Can create code once and be run on both IOS and Android devices natively. 

- Backend (Routes/DB Access) - Node.js/Express.js 
    - Robust set of features for http request handling. With this setup we can use TypeScript for both the frontend and backend, making development more efficient 

- Database – Supabase(PostgreSQL) 
    - Main need for our application is authentication, and Supabase has easy to use, quick integrations for connecting to our application. It also has an active PostgreSQL database to use when needed. 

- Hosting – Vercel 
    - Vercel is a free service that has automatic CI/CD, and monitoring.

## Deployment Plan
The frontend is deployed on vercel with this url: <a>https://mise-en-place-alpha.vercel.app/</a>. The backend is deployed with the serverless option on Railway. The database is also run through supabase.
