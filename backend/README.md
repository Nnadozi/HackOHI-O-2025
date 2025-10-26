
Now, set up the Python environment and install the necessary libraries for the backend service.

1.  **Navigate to the Backend Directory:**
  Open your terminal and change the directory to the `backend` folder within your project.

  ```bash
  cd path/to/your/HACKOHI-O-2025/backend
  ```

2.  **Create a Python Virtual Environment:**
  It's highly recommended to use a virtual environment to isolate project dependencies.

  ```bash
  python -m venv .venv
  ```

3.  **Activate the Virtual Environment:**

  *   **On macOS and Linux:**
    ```bash
    source .venv/bin/activate
    ```
  *   **On Windows (Command Prompt):**
    ```bash
    .venv\Scripts\activate.bat
    ```
  *   **On Windows (PowerShell):**
    ```powershell
    .venv\Scripts\Activate.ps1
    ```
  You should see `(.venv)` at the beginning of your terminal prompt when the environment is active.

4.  **Install Python Dependencies:**
  With the virtual environment activated, install the required packages using the requirements.txt file:

  ```bash
  pip install -r requirements.txt
  ```
  
  Note: If you see JavaScript-related errors, these are from packages trying to load browser/Jupyter components. 
  These can be safely ignored as they don't affect the FastAPI backend functionality.

5. **Run the backend:**
  
  **Option 1: Use the automated startup script (Recommended)**
  ```bash
  ./start_backend.sh
  ```
  This script automatically handles environment setup and prevents JavaScript errors.
  
  **Option 2: Use the Python startup script**
  ```bash
  python run_backend.py
  ```
  
  **Option 3: Manual FastAPI startup**
  ```bash
  # Set environment variables first to prevent JavaScript errors
  export MPLBACKEND=Agg
  export JUPYTER_PLATFORM_DIRS=0
  
  # Then run FastAPI
  fastapi dev main.py
  ```
  
  The backend will be available at http://localhost:8000
  API documentation at http://localhost:8000/docs