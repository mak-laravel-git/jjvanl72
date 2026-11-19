---
paths:
  - app/Http/Controllers/Backend/Admin/AllCasesController.php
  - app/Services/AdminCaseService.php
  - app/Services/DentalCaseFileZipService.php
  - resources/js/pages/backend/Admin/AllCases.tsx
  - resources/js/components/admin-case-detail-modal.tsx
---

# Admin All Cases

Admin All Cases is DB-backed via `AdminCaseService` + `DataTableService` (not mock data). Supports `search`, `filters[status]`, `filters[client_id]`, `filters[service]`, sort, and `per_page`. Frontend uses Wayfinder `admin/cases` index with debounced `router.get` like DentalClients. **Load** opens the shared create-case editor for that same case (`GET/PUT admin/cases/{dentalCase}/edit|update`, `adminMode: true`, AdminLayout); works for any status. Rows and modal use `database_id`. Case file zip download is `GET admin/cases/{case}/files/download` (`cases.view`); modal Download Files uses `@/routes/admin/cases/files` `download.url(caseNumber)`. Shared zip builder: `DentalCaseFileZipService`.
