# Retinal Annotation App

This project provides a simple full stack setup for annotating retinal images. The backend is built with **FastAPI** while the frontend is a **React** application using **Vite** and **Tailwind CSS**.

## Backend setup

1. Create and activate a Python virtual environment:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate
   ```
2. Install the required packages (adjust the list as needed):
   ```bash
   pip install fastapi uvicorn motor passlib[bcrypt] pillow torch torchvision fpdf
   ```
3. Start the API server:
   ```bash
   python main.py
   ```
   The API will be available at `http://localhost:8000`.

## Frontend setup

1. Install Node dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
   The application will open on `http://localhost:5173` by default.

## Project structure

- `backend/` – FastAPI backend with endpoints for uploading images, user management and predictions.
- `frontend/` – React application that provides the user interface for uploading and annotating images.

Both parts can run independently but expect to communicate over HTTP.
