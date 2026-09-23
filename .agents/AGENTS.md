# SpendWise AI Project Instructions & Fast Run Steps

## Quick Startup Instructions for SpendWise AI Web App

1. **Environment & PATH**:
   Node.js and npm binaries are located at `/home/chandu/node/bin`. Always export PATH when running commands:
   ```bash
   export PATH="/home/chandu/node/bin:$PATH"
   ```

2. **Process Check**:
   Quickly check if the dev server is already running on port 5173 or process name `vite`:
   ```bash
   ss -tulpn | grep 5173 || pgrep -af vite
   ```

3. **Running the Web App**:
   To start the web application directly without unnecessary system searches:
   ```bash
   export PATH="/home/chandu/node/bin:$PATH"; npm run dev
   ```
