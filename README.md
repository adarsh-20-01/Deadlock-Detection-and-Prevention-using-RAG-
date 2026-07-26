# Deadlock Detection & Prevention Lab Framework

A comprehensive, interactive simulation framework modeling an Operating System's resource allocation environment. The platform features dynamic visual graph rendering, multi-instance resource slots, state audit timelines, safety checks using the **Banker's Algorithm**, and active **Deadlock Prevention** modules.

This system serves as a professional-grade Computer Science final-year project, combining operating systems theoretical concepts with modern full-stack engineering design.

---

## Technical Architecture

The framework is structured as a full-stack, single-repository JavaScript application:

1. **Frontend Core**: Built using **React 18** and **Vite** for optimized hot reloading and building. Stylings are driven by a glassmorphic design system using **Tailwind CSS**. Graph visuals are rendered via **React Flow**, supporting zooming, panning, node dragging, and dynamic, active cycle highlights in red.
2. **Backend Server**: Built using **Node.js** and **Express.js**. Provides API endpoints to persist simulation profiles, load saved graphs, and run deep safety and cycle verification on the server.
3. **Algorithms Engine**: Implements theoretical graph traversals and safety checkers:
   - `DFS.js`: Custom depth-first traversal tracking vertex discovery/finishing times.
   - `CycleDetection.js`: Directed graph cycle finder using 3-color (White, Gray, Black) marking.
   - `DeadlockDetector.js`: Banker's safety state analysis (Safe/Unsafe sequences) combined with active cycle detection.
   - `DeadlockPrevention.js`: Rules for resource ordering hierarchy, hold-and-wait prevention, and immediate cycle avoidance.

---

## File Structure

```
deadlock-detection-framework/
├── algorithms/                 # Core logic engines
│   ├── Graph.js                # RAG data structure model
│   ├── DFS.js                  # DFS tracking logic
│   ├── CycleDetection.js       # directed graph cycle detector
│   ├── DeadlockDetector.js     # Safety & Deadlock evaluator
│   └── DeadlockPrevention.js   # Prevention strategies
├── server/                     # Backend API
│   ├── models/                 # File-based state persistence
│   ├── controllers/            # Endpoint logic
│   ├── routes/                 # Express route mappings
│   └── index.js                # Entry point
├── src/                        # React Frontend
│   ├── components/             # Custom glass UI panels & nodes
│   ├── context/                # Simulation state store
│   ├── hooks/                  # Synthesized audio effects hook
│   ├── App.jsx                 # Dashboard layout manager
│   ├── index.css               # Styling definitions
│   └── main.jsx
├── Dockerfile                  # Production container building
├── docker-compose.yml          # Container configuration
├── package.json                # Dependency configurations
└── README.md                   # Documentation guide
```

---

## Installation & Running Guide

Ensure you have [Node.js (v18 or higher)](https://nodejs.org/) installed.

### 1. Developer Setup
Initialize the project, install dependencies, and start both the Express API server and React frontend in development mode using a single command:

```bash
# Clone/Open the directory and run
npm install

# Start both frontend & backend concurrently
npm run dev
```

The system will start:
- Frontend Client: [http://localhost:5173](http://localhost:5173) (automatically proxied/configured)
- Backend Server: [http://localhost:5000](http://localhost:5000)

### 2. Running in Docker
To containerize and run the complete application via Docker:

```bash
# Build and run containers
docker-compose up --build
```
The unified container will build, expose port `5000`, and start the app. Access the interface at [http://localhost:5000](http://localhost:5000).

---

## API Documentation

The backend server runs on `http://localhost:5000` and exposes these JSON endpoints:

### 1. Validate Graph State
* **URL**: `/api/simulation/verify`
* **Method**: `POST`
* **Body**:
  ```json
  {
    "nodes": [
      { "id": "P1", "type": "process", "details": { "priority": 2 } },
      { "id": "R1", "type": "resource", "details": { "instances": 1 } }
    ],
    "edges": [
      { "from": "R1", "to": "P1", "type": "allocation" }
    ]
  }
  ```
* **Response**: Returns safety sequence, deadlock status, and need matrices.

### 2. Save Simulation
* **URL**: `/api/simulation/save`
* **Method**: `POST`
* **Body**:
  ```json
  {
    "id": "scenario-1",
    "name": "Classic Deadlock Pattern",
    "state": { "nodes": [...], "edges": [...] }
  }
  ```
* **Response**: `{ "success": true, "saved": { ... } }`

### 3. List Saved Simulations
* **URL**: `/api/simulation/list`
* **Method**: `GET`
* **Response**: List of saved simulation objects.

---

## Sample Test Cases & Walkthrough

Use the following step-by-step scenarios to evaluate the correctness of the framework:

### Test Case 1: Simple Safety Execution (Safe State)
1. In the simulator sidebar, click **Simulation Presets** -> **Reset Environment**.
2. Click **Add Process** -> ID: `P1`, Priority: `1`. Click **Create Process**.
3. Click **Add Resource** -> ID: `R1`, Instances: `1`. Click **Create Resource**.
4. In **Allocate & Request Edges**:
   - Select Process: `P1`
   - Select Resource: `R1`
   - Click **Allocate (R→P)** (Resource allocated to P1).
5. **Expected Outcome**: Metrics card show 1 Process, 1 Resource, 1 Allocated. Safety State card indicates **SAFE STATE** with Safe Sequence: `[P1]`.

### Test Case 2: Cycle Detection & Deadlock (Unsafe State)
1. Click **Reset Environment**.
2. Create Process `P1` and `P2`.
3. Create Resource `R1` (1 instance) and `R2` (1 instance).
4. Perform the following link connections:
   - Allocate `R1` to `P1`
   - Allocate `R2` to `P2`
   - Request `P1` to `R2` (P1 waits for R2)
   - Request `P2` to `R1` (P2 waits for R1 - completing cycle)
5. **Expected Outcome**:
   - The graph edges connecting `P1 → R2 → P2 → R1 → P1` instantly turn **Red** and start flashing.
   - The **Deadlock Status** card updates to **DEADLOCKED**.
   - The log console records: `[Timestamp] Deadlock detected! Processes involved: P1, P2`.
   - The safe sequence indicates **Unsafe State**.

### Test Case 3: Deadlock Prevention (Cycle Avoidance)
1. Click **Reset Environment**.
2. Set **Deadlock Prevention Strategy** dropdown to **Cycle Avoidance**.
3. Create Processes `P1`, `P2` and Resources `R1` (1 instance), `R2` (1 instance).
4. Allocate `R1` to `P1`.
5. Allocate `R2` to `P2`.
6. Request `P1` to `R2` (P1 goes into waiting state).
7. Now try to Request `P2` to `R1`.
8. **Expected Outcome**:
   - The request is immediately **rejected**.
   - A floating warning alert flashes at the bottom-right: **Deadlock Prevented - Request would create a cycle: P2 → R1 → P1 → R2 → P2. Allocation rejected.**
   - The edge is NOT created, preventing the system from entering a deadlocked state.
   - The sound engine triggers an error alert buzzer.
