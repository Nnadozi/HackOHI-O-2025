
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
  With the virtual environment activated, install the required packages using pip.

  ```bash
  pip install pandas matplotlib seaborn scikit-learn fastapi python-dotenv "fastapi[standard]"
  ```

5. **Run the backend:**
  With the environment being run,  use the following command
  ```bash
  fastapi dev main.py
  ```