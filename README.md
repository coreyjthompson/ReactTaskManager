## Live URLs

- **Frontend (Azure Static Web Apps)**  
  https://icy-sea-0ea21bf10.1.azurestaticapps.net

- **API (Azure App Service)**  
  https://rtm-dev-api-duggcrbxerhehxh7.centralus-01.azurewebsites.net

### Useful endpoints
- **Swagger UI**: https://rtm-dev-api-duggcrbxerhehxh7.centralus-01.azurewebsites.net/swagger  
- **Health**: https://rtm-dev-api-duggcrbxerhehxh7.centralus-01.azurewebsites.net/health

---

## Frontend ↔ API wiring

The React app calls the API via `REACT_APP_API_BASE_URL`.

- **Production (SWA GitHub Action)**
  ```yaml
  # .github/workflows/<your-swa-workflow>.yml
  env:
    REACT_APP_API_BASE_URL: https://rtm-dev-api-duggcrbxerhehxh7.centralus-01.azurewebsites.net
    CI: false
