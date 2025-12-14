# Apt-Apt Visualization Dashboard

Apt-Apt is an interactive apartment quality visualization dashboard built with Angular and D3.js.

> [!NOTE]
> This project was previously configured to use a local MSSQL server for data storage. To create a portable artifact, the data has been converted to CSV format (subset of the original csv data from Swiss Dwellings) (`geometries.csv`, `simulations.csv`, and `apartment_rankings.csv`), removing the need for a database installation.

## Prerequisites

Before running the application, ensure you have the following installed:

1.  **Node.js** (v18 or higher recommended) - [Download](https://nodejs.org/)

*Note: Microsoft SQL Server is **no longer required**. The application now uses a lightweight CSV-based backend.*

## Data Setup

The application loads apartment data directly from CSV files located in the `data/` directory:
- `geometries.csv`
- `simulations.csv`
- `apartment_rankings.csv`

Ensure these files are present before starting the server.

## Automatic Setup & Run

We have provided a one-click script for Windows users.

1.  Double-click `setup_and_run.bat` in the root folder.
2.  The script will:
    *   Check for Node.js.
    *   Install dependencies for the Server (`cd backend && npm install`).
    *   Install dependencies for the Client (`cd apt-apt && npm install`).
    *   Launch both the Backend (port 3000) and Frontend (port 4200) servers.

## Manual Setup

If you prefer to run it manually or are on Mac/Linux:

### 1. Backend (API)
Open a terminal in the `backend` folder:
```bash
cd backend
npm install
node server.js
```
The server will load CSV data (approx 5-10 seconds) and start at `http://localhost:3000`.

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
*   **Backend**: Node.js + Express + CSV Parser (./backend)
*   **Data**: CSV Files (./data)
