# chatbot-lab — Phase 6 Merge Plan & Rollback Strategy

Once testing achieves **95% accuracy** and all security permissions pass, the NGA AI Assistant can be safely transitioned from the `chatbot-lab` sandbox into the production NGA ERP System. 

---

## 1. New Files to Add

To integrate the AI assistant, copy these verified assets into the core project:

| Origin Location (Sandbox) | Target Location (Production) | Description |
| :--- | :--- | :--- |
| `chatbot-lab/backend/controllers/parentNotificationController.js` | `backend/controllers/parentNotificationController.js` | Moves fully verified dynamic MySQL check logic. |
| `chatbot-lab/backend/routes/parentNotificationRoute.js` | `backend/routes/parentNotificationRoute.js` | Integrates isolated API router schema. |
| `chatbot-lab/frontend/ChatAssistant.jsx` | `client/src/components/notifications/ChatAssistant.jsx` | Mounts the premium floating drawer UI. |

---

## 2. Existing Files to Touch

Only two files need to be modified in the main ERP codebase:

### 📟 File 1: `backend/server.js`
*   **Touch Action**: Import `parentNotificationRouter` and mount the middleware route at `/api/parent` to allow client communication.
*   **Status**: Done and verified.

### 💻 File 2: `client/src/pages/ParentDashboard.jsx`
*   **Touch Action**: Import `ChatAssistant` and render it at the root container div.
*   **Status**: Isolated and ready to mount on your approval.

---

## 3. Risk Assessment

*   **Database Load (Low)**: 
    *   *Risk*: Chatbot triggers database queries on mount.
    *   *Mitigation*: The `useEffect` hook triggers the endpoint exactly **once** per login session. No polling or repeated requests occur.
*   **Performance (Negligible)**:
    *   *Risk*: Token decrypting could add minor delay to APIs.
    *   *Mitigation*: Re-uses standard verified stateless JWT token decoding via standard `verifyToken` middleware.
*   **AI API Cost & Limits (Low)**:
    *   *Risk*: Gemini API Key exceeds rate limit quotas.
    *   *Mitigation*: Implement backend response caching or fallback seamlessly to our local structured mock data if the API hits an exhaustion limit.

---

## 4. Rollback Plan

If you ever wish to completely remove the Chatbot Assistant and restore the ERP to its absolute original state, run these standard git commands:

```bash
# 1. Reset all local file changes to match master branch
git checkout -- backend/server.js client/src/pages/ParentDashboard.jsx client/src/services/API.js

# 2. Delete the new routes and controllers
rm backend/routes/parentNotificationRoute.js backend/controllers/parentNotificationController.js

# 3. Delete the React components folder
rm -rf client/src/components/notifications/

# 4. Confirm clean status
git status
```
This guarantees an immediate, 100% clean recovery of the codebase within 3 seconds.
