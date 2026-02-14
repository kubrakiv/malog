Added the two new YouScore proxy endpoints and wired them up, reusing the same API key auth and 202 polling behavior.

Changes:

- Added get_company_info and get_usr_info in base/views/youscore_views.py
- Added routes in base/urls/youscore_urls.py
- Extracted API key validation to a shared helper so all endpoints behave consistently

New endpoints:

- Company info:
  GET /api/youscore/companyInfo/<natcomid>
  Calls: /v1/companyInfo/{natcomid}
- FOP info:
  GET /api/youscore/usr/<natcomid>?showCurrentData=True
  Calls: /v1/usr/{natcomid} with showCurrentData=True
