# API Endpoint Specification

## Endpoint: [METHOD] /api/v1/[path]

### Summary
[One sentence describing what this endpoint does.]

### Authentication
- **Required:** Yes / No
- **Roles:** [admin, project_manager, engineer, viewer]

### Request

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | [Description] |

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `page_size` | int | 20 | Items per page |

**Request Body:**
```json
{
  "field": "value"
}
```

### Response

**Success (200):**
```json
{
  "success": true,
  "data": { },
  "message": "Description",
  "meta": {
    "timestamp": "2026-06-30T12:00:00Z",
    "request_id": "req_abc123"
  }
}
```

**Error (4XX):**
```json
{
  "success": false,
  "data": null,
  "message": "Error description",
  "errors": [
    { "field": "field_name", "message": "Specific error" }
  ]
}
```

### Error Codes

| Code | Condition |
|------|-----------|
| 400 | [Validation error] |
| 401 | [Missing/invalid token] |
| 403 | [Insufficient permissions] |
| 404 | [Resource not found] |

### Rate Limit
[Requests per time window]

### Related
- **Requirement:** [FR-XXX]
- **Database:** [tables accessed]
- **Service:** [service method]
