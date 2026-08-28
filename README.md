# WorkLog AI

**WorkLog AI** is a smart productivity tracking application designed to help professionals log their daily activities and gain meaningful insights through AI-powered summarization.

![Project Status](https://img.shields.io/badge/Status-Active-success)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Features

- **🔐 Secure Authentication**: User registration and login protected by JWT.
- **📅 Interactive Calendar**: Visual timeline of your work logs.
- **📝 Daily Logging**: effortless creation and editing of work entries.
- **🤖 AI Insights**: Generate intelligent weekly or monthly summaries of your progress using advanced LLMs (via Hugging Face).
- **📊 Excel Export**: Download your work logs for reporting and offline analysis.
- **🎨 Modern UI**: Built with a beautiful, responsive dark/light mode interface using Tailwind CSS.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS, Radix UI, Lucide Icons
- **State Management**: React Hooks & Context API
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js & Express.js
- **Database**: MongoDB (Mongoose)
- **AI Integration**: Hugging Face Inference API / OpenAI SDK
- **Authentication**: JSON Web Tokens (JWT)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB connection string

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/work-log-ai.git
    cd work-log-ai
    ```

2.  **Setup Backend**
    ```bash
    cd backend
    npm install
    ```
    Create a `.env` file in the `backend` folder:
    ```env
    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_secret_key
    HUGGING_FACE_API_KEY=your_hf_token
    ```
    Start the server:
    ```bash
    npm run dev
    ```

3.  **Setup Frontend**
    ```bash
    cd ../frontend
    npm install
    ```
    Create a `.env` file in the `frontend` folder (optional for local dev):
    ```env
    VITE_API_URL=http://localhost:5000/api
    ```
    Start the client:
    ```bash
    npm run dev
    ```

## 🌍 Deployment

Check out the [DEPLOYMENT.md](./DEPLOYMENT.md) file for detailed instructions on deploying to Render (Backend) and Vercel (Frontend).

## 📄 License

This project is licensed under the MIT License.
