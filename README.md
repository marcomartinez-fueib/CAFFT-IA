# CAFFT 5.1

**Deploying to the UIB server?** See
[`docs/deploy/DEPLOYMENT.md`](docs/deploy/DEPLOYMENT.md) for the on-premise
deployment at <https://pausat.uib.es/cafft/>.

**Running locally?** `npm install && npm run dev`, then open
<http://localhost:3000/cafft/> (note the `/cafft/` path — it is the app's base
path). Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY` to enable
the AI features. Video files go in `public/videos_cafft/`; see
[`PLACE_VIDEOS_HERE.txt`](public/videos_cafft/PLACE_VIDEOS_HERE.txt) for the
expected filenames.

---

## Older notes: running from a plain static server

> The instructions below predate the Vite build setup and are kept only for
> reference. They describe opening the project through a bare static server,
> which no longer works on its own — the TypeScript sources need to be built
> first. Use `npm run dev` instead.

Hello! I understand you've been having trouble running this application locally. I sincerely apologize for the frustration this has caused. The following updated instructions are designed to be as clear and simple as possible to get you up and running to test the exposure videos.

The main issue likely stems from how video files are located by the application. I have made a code change to make this more reliable with simple local servers. Please follow these updated steps carefully.

---

## How to Run (Updated & Simplified)

### Step 1: Prepare Your Folder

1.  **Unzip all project files** into a new, empty folder on your computer. Your folder should look like this, with `index.html` at the top level:
    ```
    your-folder/
    ├── components/
    ├── data/
    ├── hooks/
    ├── ... (other project folders)
    ├── index.html
    ├── index.tsx
    └── ... (other project files)
    ```

2.  **Create the Videos Folder**:
    *   Inside this main folder (at the same level as `index.html`), create a **new folder** and name it exactly `videos_cafft`.
    *   The `public` folder shown in the project image can be ignored for this local setup.

3.  **Add Your Video Files**:
    *   Place your MP4 video files inside the `videos_cafft` folder.
    *   The videos **must** be named using the format: `[video_id]_[language_code].mp4`.
    *   **Example**: For video `ev001` in English, the filename is `ev001_en.mp4`. For Catalan, it's `ev001_ca.mp4`.
    *   The application uses video IDs: `ev001`, `ev002`, `ev003`, `ev004`, `ev005`, `ev006`.
    *   Your final folder structure should look like this:
    ```
    your-folder/
    ├── videos_cafft/
    │   ├── ev001_ca.mp4
    │   ├── ev001_en.mp4
    │   ├── ev001_es.mp4
    │   ├── ev002_ca.mp4
    │   └── ... (and so on for all your videos)
    ├── components/
    ├── ...
    └── index.html
    ```

---

### Step 2: Run a Local Web Server

**This step is essential.** You cannot just open the `index.html` file in your browser. It must be "served" by a local server. Here are two easy methods.

#### Method A: Using VS Code's "Live Server" (Recommended)

1.  **Install Visual Studio Code**: If you don't have it, it's a free code editor.
2.  **Install the "Live Server" Extension**:
    *   Open VS Code.
    *   Go to the Extensions view (click the square icon on the left sidebar).
    *   Search for `Live Server` (by Ritwick Dey) and click "Install".
3.  **Open Your Project**: In VS Code, go to `File > Open Folder...` and select `your-folder`.
4.  **Start the Server**: In the file explorer panel on the left, **right-click on the `index.html` file** and select **"Open with Live Server"**.
5.  Your browser will automatically open to the correct address (like `http://127.0.0.1:5500`), and the application should now be running.

#### Method B: Using Python

If you have Python installed on your system, this is a very reliable alternative.

1.  **Open a Terminal**:
    *   **On Windows**: Open the Command Prompt or PowerShell.
    *   **On macOS/Linux**: Open the Terminal application.
2.  **Navigate to Your Folder**: Use the `cd` command to go into your project folder.
    *   Example: `cd Desktop/your-folder`
3.  **Run the Server Command**:
    *   If you have Python 3: `python -m http.server`
    *   If you have Python 2: `python -m SimpleHTTPServer`
4.  **Open in Browser**: The terminal will show a message like `Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/)`. Open your web browser (Chrome, Firefox, etc.) and go to the address: **`http://localhost:8000`**.

---

### Troubleshooting

*   **"My videos don't load, I see an error."**:
    *   Double-check that your video folder is named exactly `videos_cafft` (all lowercase).
    *   Verify the folder is at the same level as `index.html`, not inside another folder.
    *   Verify your video filenames are perfect, e.g., `ev001_en.mp4`. Check for typos.
*   **"I see a blank page or a code error."**:
    *   Make sure you are running a local server as described above and are visiting `http://localhost...`, not `file://...`.
    *   Try clearing your browser cache for the local server address.

I am confident that these updated instructions and the code change will resolve the issue. Please let me know if you have any more trouble.
