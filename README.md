# FindMyCar: IoT-Based Parking Assistance System

## Overview
**FindMyCar** is an IoT-based parking assistance system designed to help users locate their parked cars using Raspberry Pi and a camera module. The system captures license plate images at parking spots, processes the information locally, and stores it in a centralized database for real-time query and retrieval.

### Key Features
- **Image Capture and Processing**: Raspberry Pi captures license plates and extracts their text using OCR.
- **Message Handling**: MQTT protocol for sending processed data to a centralized handler.
- **Cloud Integration**: Data is stored in a MongoDB database hosted on the cloud .
- **Frontend Dashboard**: React-based interface to query and display parking information.
- **Live Information Display** : Front-end uses WebSockets and MongoDB Atlas Streams to enable live data transmission.

## System Components
1. **Raspberry Pi**: Captures license plate images.
2. **MQTT Handler**: Processes and forwards messages.
3. **Lambda Function**: Writes messages to MongoDB instance hostend on the cloud.
3. **MongoDB Database**: Stores license plate and parking spot information.
4. **React Frontend**: Provides a user-friendly interface to access parking data.

## Project Structure - FindMyCar ( Front-End )

```
findmycar/
├── src/                   # React Frontend Source Code
│   ├── components/        # Reusable UI components
│   ├── models/            # 3D models for the parking environment
│   ├── index.css          # Styling
│   ├── main.jsx           # Entry point for React app
│   └── App.jsx            # Main application logic
├── parking-backend/       # Backend Code for MQTT and Database
│   ├── models/            # MongoDB schema definitions
│   ├── controllers/       # Backend business logic
│   ├── app.js             # Main entry point
│   └── index.js           # Server initialization
├── package.json           # Dependency management for React app
├── tailwind.config.js     # Tailwind CSS configuration
└── .gitignore             # Git ignore rules
```
### Prerequesites 
- npm 
- node_modules 

### To Run 
1. Navigate to the backend directory:
   ```bash
   cd findmycar/parking-backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`:
  
4. Start the backend server:
   ```bash
   npm run start 
   ```

### Frontend Setup
1. Navigate to the React frontend directory:
   ```bash
   cd findmycar
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## Usage
- Use the React-based dashboard to query parking logs.
- Monitor parking lot logs

---

## Aws Lambda Function

## Overview
This project implements a serverless function to handle IoT messages by storing them in a MongoDB database. The function parses incoming messages, connects to a MongoDB instance, and inserts the data into a specified collection.

### Key Features
- **IoT Message Parsing**: Supports multiple payload formats, including IoT Core and HTTP body.
- **Database Interaction**: Dynamically connects to a MongoDB database using environment variables.
- **Error Handling**: Includes robust error handling for parsing and database operations.

## File Structure
```
- index.mjs   # Main function logic to handle IoT events and store them in MongoDB
- .env        # Store environement variables
```

## Setup and Configuration

### Environment Variables
The function requires the following environment variables:
- `MONGODB_URI`: Connection string for the MongoDB database.
- `DB_NAME`: Name of the database.
- `COLLECTION_NAME`: Name of the collection to store IoT data.

### Deployment
1. Configure your cloud provider to deploy the function. For example, on AWS Lambda:
   - Create a new Lambda function.
   - Set up the environment variables (`MONGODB_URI`, `DB_NAME`, `COLLECTION_NAME`).
   - Upload the `index.mjs` file.
   - Add the `mongodb` dependency in your deployment package.
2. Test the deployment by sending sample IoT payloads to the function's endpoint.

## Error Handling
- Logs errors to the console for debugging purposes.
- Returns appropriate HTTP status codes:
  - `200`: Data stored successfully.
  - `500`: Error processing the message.

# Raspberry Pi IoT Module

## Overview
The `loop` folder contains the code that  is designed to operate on a Raspberry Pi, enabling edge device functionality for data capture, processing, and secure communication. This repository includes Python scripts, environmental configurations, and supporting assets for deployment.

### Key Features
- **Image Processing**: Structured image storage for analysis.
- **Image Segmentation** : Segmented images based on sensor inputs to reduce network load
- **Raspberry Pi Integration**: Scripts optimized for Raspberry Pi functionality.

## Project Structure
```
loop/
├── .env                   # Environment variables for secure configuration
├── RaspberryPi.py         # Main script for Raspberry Pi operation
├── images/                # Directory for captured images
│   ├── left/              # Images from the left camera module
│   ├── right/             # Images from the right camera module
│   └── full/              # Full image captures
├── certificates/          # SSL/TLS certificates and related files
│   └── required-files.txt # List of required files for communicating with AWS
```

## Setup and Configuration

### Prerequisites
- Raspberry Pi with Python 3 installed
- Camera module(s) connected to the Raspberry Pi
- SSL/TLS certificates for secure communication

### Running the Application
- To start the Raspberry Pi module, run:
  ```bash
  python3 RaspberryPi.py
  ```

## Notes
- Ensure proper configuration of the `.env` file for code to execute .

## Contributions
Gopal Guruprasath 
Koh Chee Kiat
Elvern Neylmav Tanny
Noven Zen Hong Guan 

3d models from https://poly.pizza
Basic IR sensor setup https://www.donskytech.com/using-infrared-ir-sensor-with-raspberry-pi/