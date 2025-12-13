# Apt-Apt Visualization Dashboard

Apt-Apt is an interactive apartment quality visualization dashboard built with Angular and D3.js.

## Prerequisites

Before running the application, ensure you have the following installed:

1.  **Node.js** (v18 or higher recommended) - [Download](https://nodejs.org/)
2.  **Microsoft SQL Server** (Express or Developer edition)
3.  **SQL Server Management Studio (SSMS)** (Optional, for managing DB)

## Database Setup

The application relies on a SQL Server database for geometry and simulation data.

1.  Create a new database named `apt-apt`.
2.  Open **SQL Server Management Studio**.
3.  Execute the provided SQL scripts in the following order:
    *   `Geometries.sql` (Creates tables and inserts structure data)
    *   `Simulations.sql` (Inserts simulation metrics)
4.  **Configuration**: The backend connects to the server `Gaurii` with user `general` by default. 
    *   To change this, edit `server.js` (lines 8-18).

## Automatic Setup & Run

We have provided a one-click script for Windows users.

1.  Double-click `setup_and_run.bat` in the root folder.
2.  The script will:
    *   Check for Node.js.
    *   Install dependencies for the Server (`cd backend && npm install`).
    *   Install dependencies for the Client (`cd apt-apt && npm install`).
    *   Launch both the Backend and Frontend servers.

## Manual Setup

If you prefer to run it manually or are on Mac/Linux:

### 1. Backend (API)
Open a terminal in the `backend` folder:
```bash
cd backend
npm install
node server.js
```
Server runs at `http://localhost:3000`.

### 2. Frontend (Angular App)
Open a new terminal in `apt-apt`:
```bash
cd apt-apt
npm install
ng serve
```
Application runs at `http://localhost:4200`.

## Architecture

*   **Frontend**: Angular 17 + D3.js (./apt-apt)
*   **Backend**: Node.js + Express + MSSQL (./backend)
*   **Database**: MS SQL Server (`apt-apt` DB)
