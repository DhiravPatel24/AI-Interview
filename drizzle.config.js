// require('dotenv').config();
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './utils/schema.js',
  dialect: 'postgresql',
  dbCredentials: {
    url:'postgresql://ai-interview-mocker_owner:iob3Xf0NeKSh@ep-odd-base-a5vctyl6.us-east-2.aws.neon.tech/ai-interview-mocker?sslmode=require'
  },
});