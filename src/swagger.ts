const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'BOA AgriHub API',
    version: '1.0.0',
    description:
      'REST API for the BOA AgriHub platform — manages aggregation centre applications, commodity intake, warehouse receipts, and loan applications.',
    contact: { name: 'BOA Platform Team' },
  },
  servers: [{ url: 'http://localhost:4000', description: 'Local dev server' }],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      // ── Shared ─────────────────────────────────────────────────────────────
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page:       { type: 'integer' },
          limit:      { type: 'integer' },
          total:      { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },

      // ── Auth ───────────────────────────────────────────────────────────────
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email:    { type: 'string', format: 'email', example: 'admin@boa.ng' },
          password: { type: 'string', format: 'password', example: 'secret123' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          token:   { type: 'string' },
          user: {
            type: 'object',
            properties: {
              id:       { type: 'integer' },
              email:    { type: 'string' },
              name:     { type: 'string' },
              role:     { type: 'string', enum: ['admin', 'super_admin', 'centre_manager'] },
              centreId: { type: 'integer', nullable: true },
            },
          },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email:    { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          name:     { type: 'string' },
          role:     { type: 'string', enum: ['admin', 'super_admin', 'centre_manager'] },
          centreId: { type: 'integer', nullable: true },
        },
      },
      User: {
        type: 'object',
        properties: {
          id:        { type: 'integer' },
          email:     { type: 'string' },
          name:      { type: 'string' },
          role:      { type: 'string', enum: ['admin', 'super_admin', 'centre_manager'] },
          centreId:  { type: 'integer', nullable: true },
          isActive:  { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },

      // ── Applications ───────────────────────────────────────────────────────
      CreateApplicationRequest: {
        type: 'object',
        required: ['centreName', 'centreType'],
        properties: {
          centreName:              { type: 'string' },
          centreType:              { type: 'string', enum: ['primary', 'secondary', 'collection_point'] },
          regNumber:               { type: 'string' },
          tinNumber:               { type: 'string' },
          yearEstablished:         { type: 'integer' },
          ownerName:               { type: 'string' },
          ownerPhone:              { type: 'string' },
          ownerNin:                { type: 'string' },
          commodities:             { type: 'array', items: { type: 'string' } },
          capacityMt:              { type: 'number' },
          coldStorageCapacityMt:   { type: 'number' },
          numBays:                 { type: 'integer' },
          floorAreaSqm:            { type: 'number' },
          warehouseType:           { type: 'string', enum: ['silo', 'shed', 'open_yard', 'cold_storage', 'mixed'] },
          facilities:              { type: 'array', items: { type: 'string' } },
          powerSource:             { type: 'string', enum: ['grid', 'generator', 'solar', 'none'] },
          waterSource:             { type: 'string', enum: ['borehole', 'tap', 'none'] },
          hasAccessRoad:           { type: 'boolean' },
          warehouseReceiptCapable: { type: 'boolean' },
          address:                 { type: 'string' },
          state:                   { type: 'string' },
          lga:                     { type: 'string' },
          gpsLat:                  { type: 'string' },
          gpsLng:                  { type: 'string' },
          managerName:             { type: 'string' },
          managerPhone:            { type: 'string' },
          managerNin:              { type: 'string' },
          managerEmail:            { type: 'string', format: 'email' },
          bankName:                { type: 'string' },
          accountNumber:           { type: 'string' },
          bvn:                     { type: 'string' },
        },
      },
      Application: {
        type: 'object',
        properties: {
          id:          { type: 'integer' },
          refId:       { type: 'string' },
          centreName:  { type: 'string' },
          centreType:  { type: 'string' },
          status:      { type: 'string', enum: ['pending', 'under_review', 'approved', 'rejected'] },
          state:       { type: 'string' },
          reviewNotes: { type: 'string', nullable: true },
          createdAt:   { type: 'string', format: 'date-time' },
          updatedAt:   { type: 'string', format: 'date-time' },
        },
      },
      UpdateApplicationStatusRequest: {
        type: 'object',
        required: ['status'],
        properties: {
          status:      { type: 'string', enum: ['pending', 'under_review', 'approved', 'rejected'] },
          reviewNotes: { type: 'string' },
        },
      },

      // ── Aggregation Centres ────────────────────────────────────────────────
      AggregationCentre: {
        type: 'object',
        properties: {
          id:                      { type: 'integer' },
          refId:                   { type: 'string' },
          applicationId:           { type: 'integer', nullable: true },
          centreName:              { type: 'string' },
          centreType:              { type: 'string' },
          status:                  { type: 'string', enum: ['active', 'suspended', 'decommissioned'] },
          state:                   { type: 'string' },
          lga:                     { type: 'string', nullable: true },
          address:                 { type: 'string', nullable: true },
          capacityMt:              { type: 'number', nullable: true },
          commodities:             { type: 'string', nullable: true },
          managerName:             { type: 'string', nullable: true },
          managerPhone:            { type: 'string', nullable: true },
          warehouseReceiptCapable: { type: 'boolean', nullable: true },
          createdAt:               { type: 'string', format: 'date-time' },
          updatedAt:               { type: 'string', format: 'date-time' },
        },
      },

      // ── Commodity Intake ───────────────────────────────────────────────────
      CreateIntakeRequest: {
        type: 'object',
        required: ['commodity', 'quantityKg'],
        properties: {
          commodity:    { type: 'string' },
          quantityKg:   { type: 'number' },
          gradeQuality: { type: 'string' },
          farmerName:   { type: 'string' },
          farmerPhone:  { type: 'string' },
          farmerNin:    { type: 'string' },
          sourceState:  { type: 'string' },
          sourceLga:    { type: 'string' },
          notes:        { type: 'string' },
        },
      },
      CommodityIntake: {
        type: 'object',
        properties: {
          id:           { type: 'integer' },
          refId:        { type: 'string' },
          centreId:     { type: 'integer' },
          centreName:   { type: 'string' },
          commodity:    { type: 'string' },
          quantityKg:   { type: 'number' },
          gradeQuality: { type: 'string', nullable: true },
          farmerName:   { type: 'string', nullable: true },
          farmerPhone:  { type: 'string', nullable: true },
          sourceState:  { type: 'string', nullable: true },
          loggedBy:     { type: 'integer' },
          createdAt:    { type: 'string', format: 'date-time' },
        },
      },

      // ── Warehouse Receipts ─────────────────────────────────────────────────
      CreateReceiptRequest: {
        type: 'object',
        required: ['commodity', 'quantityKg', 'farmerName'],
        properties: {
          intakeId:     { type: 'integer' },
          commodity:    { type: 'string' },
          quantityKg:   { type: 'number' },
          gradeQuality: { type: 'string' },
          farmerName:   { type: 'string' },
          farmerPhone:  { type: 'string' },
          farmerNin:    { type: 'string' },
          expiresAt:    { type: 'string', format: 'date-time' },
          notes:        { type: 'string' },
        },
      },
      WarehouseReceipt: {
        type: 'object',
        properties: {
          id:            { type: 'integer' },
          receiptNumber: { type: 'string' },
          centreId:      { type: 'integer' },
          centreName:    { type: 'string' },
          intakeId:      { type: 'integer', nullable: true },
          commodity:     { type: 'string' },
          quantityKg:    { type: 'number' },
          gradeQuality:  { type: 'string', nullable: true },
          farmerName:    { type: 'string' },
          farmerPhone:   { type: 'string', nullable: true },
          status:        { type: 'string', enum: ['active', 'pledged', 'redeemed', 'expired'] },
          issuedAt:      { type: 'string', format: 'date-time' },
          expiresAt:     { type: 'string', format: 'date-time', nullable: true },
          createdAt:     { type: 'string', format: 'date-time' },
        },
      },
      UpdateReceiptStatusRequest: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['active', 'pledged', 'redeemed', 'expired'] },
        },
      },

      // ── Loan Applications ──────────────────────────────────────────────────
      CreateLoanRequest: {
        type: 'object',
        required: ['receiptNumber', 'loanAmountRequested'],
        properties: {
          receiptNumber:       { type: 'string' },
          loanAmountRequested: { type: 'number' },
          farmerName:          { type: 'string' },
          farmerPhone:         { type: 'string' },
          farmerNin:           { type: 'string' },
        },
      },
      CreateLoanPublicRequest: {
        type: 'object',
        required: ['receiptNumber', 'loanAmountRequested', 'farmerName'],
        properties: {
          receiptNumber:       { type: 'string' },
          loanAmountRequested: { type: 'number' },
          farmerName:          { type: 'string' },
          farmerPhone:         { type: 'string' },
          farmerNin:           { type: 'string' },
        },
      },
      LoanApplication: {
        type: 'object',
        properties: {
          id:                    { type: 'integer' },
          refId:                 { type: 'string' },
          receiptId:             { type: 'integer' },
          receiptNumber:         { type: 'string' },
          centreId:              { type: 'integer' },
          centreName:            { type: 'string' },
          commodity:             { type: 'string' },
          quantityKg:            { type: 'number' },
          farmerName:            { type: 'string' },
          farmerPhone:           { type: 'string', nullable: true },
          loanAmountRequested:   { type: 'number' },
          loanAmountApproved:    { type: 'number', nullable: true },
          interestRate:          { type: 'number', nullable: true },
          repaymentPeriodMonths: { type: 'integer', nullable: true },
          status:                { type: 'string', enum: ['pending', 'approved', 'disbursed', 'repaid', 'defaulted', 'rejected'] },
          reviewNotes:           { type: 'string', nullable: true },
          createdAt:             { type: 'string', format: 'date-time' },
        },
      },
      UpdateLoanStatusRequest: {
        type: 'object',
        required: ['status'],
        properties: {
          status:                { type: 'string', enum: ['pending', 'approved', 'disbursed', 'repaid', 'defaulted', 'rejected'] },
          loanAmountApproved:    { type: 'number' },
          interestRate:          { type: 'number' },
          repaymentPeriodMonths: { type: 'integer' },
          reviewNotes:           { type: 'string' },
        },
      },

      // ── Notifications ──────────────────────────────────────────────────────
      Notification: {
        type: 'object',
        properties: {
          id:        { type: 'integer' },
          userId:    { type: 'integer' },
          type:      { type: 'string' },
          title:     { type: 'string' },
          body:      { type: 'string' },
          isRead:    { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      // ── Analytics ──────────────────────────────────────────────────────────
      AnalyticsStats: {
        type: 'object',
        properties: {
          applications: {
            type: 'object',
            properties: {
              total:       { type: 'integer' },
              pending:     { type: 'integer' },
              under_review:{ type: 'integer' },
              approved:    { type: 'integer' },
              rejected:    { type: 'integer' },
            },
          },
          centres: {
            type: 'object',
            properties: {
              total:     { type: 'integer' },
              active:    { type: 'integer' },
              suspended: { type: 'integer' },
            },
          },
          intakes: {
            type: 'object',
            properties: {
              total:          { type: 'integer' },
              totalQuantityKg: { type: 'number' },
            },
          },
          receipts: {
            type: 'object',
            properties: {
              total:    { type: 'integer' },
              active:   { type: 'integer' },
              pledged:  { type: 'integer' },
            },
          },
          loans: {
            type: 'object',
            properties: {
              total:    { type: 'integer' },
              pending:  { type: 'integer' },
              approved: { type: 'integer' },
            },
          },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Missing or invalid JWT token',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Forbidden: {
        description: 'Insufficient permissions',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      NotFound: {
        description: 'Resource not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
    },
  },
  security: [],
  tags: [
    { name: 'Auth',                description: 'Authentication and user identity' },
    { name: 'Applications',        description: 'Aggregation centre registration applications' },
    { name: 'Aggregation Centres', description: 'Approved aggregation centres' },
    { name: 'Users',               description: 'Platform user management' },
    { name: 'Commodity Intake',    description: 'Commodity deposit records' },
    { name: 'Warehouse Receipts',  description: 'Warehouse receipt issuance and management' },
    { name: 'Loan Applications',   description: 'Loan applications backed by warehouse receipts' },
    { name: 'Notifications',       description: 'In-app notifications' },
    { name: 'Analytics',           description: 'Platform-wide statistics' },
    { name: 'Export',              description: 'CSV data exports' },
  ],
  paths: {
    // ── Auth ─────────────────────────────────────────────────────────────────
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        description: 'Authenticate with email and password. Returns a JWT.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        description: 'Create a new platform user. Requires super_admin role.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
        },
        responses: {
          201: {
            description: 'User created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current authenticated user',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Current user profile',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    // ── Applications ──────────────────────────────────────────────────────────
    '/api/applications': {
      post: {
        tags: ['Applications'],
        summary: 'Submit a new centre application',
        description: 'Public endpoint — no authentication required.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateApplicationRequest' } } },
        },
        responses: {
          201: {
            description: 'Application submitted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    refId:   { type: 'string', description: 'Use this reference ID to track your application.' },
                    application: { $ref: '#/components/schemas/Application' },
                  },
                },
              },
            },
          },
        },
      },
      get: {
        tags: ['Applications'],
        summary: 'List all applications',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'under_review', 'approved', 'rejected'] } },
          { name: 'state',  in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'page',   in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit',  in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: {
            description: 'Paginated list of applications',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success:      { type: 'boolean' },
                    applications: { type: 'array', items: { $ref: '#/components/schemas/Application' } },
                    pagination:   { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/applications/ref/{refId}': {
      get: {
        tags: ['Applications'],
        summary: 'Get application by reference ID',
        description: 'Public endpoint — allows applicants to track their submission.',
        parameters: [{ name: 'refId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Application details',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Application' } } },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/applications/{id}': {
      get: {
        tags: ['Applications'],
        summary: 'Get application by ID',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: {
            description: 'Application details',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Application' } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/applications/{id}/status': {
      patch: {
        tags: ['Applications'],
        summary: 'Update application status',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateApplicationStatusRequest' } } },
        },
        responses: {
          200: {
            description: 'Status updated',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Application' } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ── Aggregation Centres ────────────────────────────────────────────────────
    '/api/aggregation-centres': {
      get: {
        tags: ['Aggregation Centres'],
        summary: 'List aggregation centres',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'suspended', 'decommissioned'] } },
          { name: 'state',  in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'page',   in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit',  in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: {
            description: 'Paginated list of centres',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success:  { type: 'boolean' },
                    centres:  { type: 'array', items: { $ref: '#/components/schemas/AggregationCentre' } },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/aggregation-centres/ref/{refId}': {
      get: {
        tags: ['Aggregation Centres'],
        summary: 'Get centre by reference ID',
        description: 'Public endpoint.',
        parameters: [{ name: 'refId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Centre details',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AggregationCentre' } } },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/aggregation-centres/{id}': {
      get: {
        tags: ['Aggregation Centres'],
        summary: 'Get centre by ID',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: {
            description: 'Centre details',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AggregationCentre' } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Aggregation Centres'],
        summary: 'Update centre details',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                description: 'Any subset of AggregationCentre fields to update',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Updated centre',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AggregationCentre' } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ── Users ─────────────────────────────────────────────────────────────────
    '/api/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Get own profile',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Current user',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update own profile',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name:  { type: 'string' },
                  email: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Updated profile',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/users': {
      get: {
        tags: ['Users'],
        summary: 'List all users',
        description: 'Requires super_admin role.',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page',  in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: {
            description: 'List of users',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    users:   { type: 'array', items: { $ref: '#/components/schemas/User' } },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get user by ID',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: {
            description: 'User profile',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update user',
        description: 'Requires super_admin role.',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name:     { type: 'string' },
                  email:    { type: 'string', format: 'email' },
                  role:     { type: 'string', enum: ['admin', 'super_admin', 'centre_manager'] },
                  isActive: { type: 'boolean' },
                  centreId: { type: 'integer', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Updated user',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/users/{id}/change-password': {
      post: {
        tags: ['Users'],
        summary: 'Change password',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string', format: 'password' },
                  newPassword:     { type: 'string', format: 'password', minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Password changed successfully',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    // ── Commodity Intake ──────────────────────────────────────────────────────
    '/api/commodity-intake': {
      get: {
        tags: ['Commodity Intake'],
        summary: 'List commodity intake records',
        description: 'Requires centre_manager, admin, or super_admin role.',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page',  in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: {
            description: 'List of intake records',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    intakes: { type: 'array', items: { $ref: '#/components/schemas/CommodityIntake' } },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        tags: ['Commodity Intake'],
        summary: 'Log a commodity intake',
        description: 'Requires centre_manager, admin, or super_admin role.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateIntakeRequest' } } },
        },
        responses: {
          201: {
            description: 'Intake record created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CommodityIntake' } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/commodity-intake/{id}': {
      get: {
        tags: ['Commodity Intake'],
        summary: 'Get intake record by ID',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: {
            description: 'Intake record',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CommodityIntake' } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ── Warehouse Receipts ────────────────────────────────────────────────────
    '/api/warehouse-receipts/verify/{receiptNumber}': {
      get: {
        tags: ['Warehouse Receipts'],
        summary: 'Verify a warehouse receipt',
        description: 'Public endpoint — allows anyone to verify receipt authenticity.',
        parameters: [{ name: 'receiptNumber', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Receipt details',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/WarehouseReceipt' } } },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/warehouse-receipts': {
      get: {
        tags: ['Warehouse Receipts'],
        summary: 'List warehouse receipts',
        description: 'Requires centre_manager, admin, or super_admin role.',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'pledged', 'redeemed', 'expired'] } },
          { name: 'page',   in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit',  in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: {
            description: 'List of receipts',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success:  { type: 'boolean' },
                    receipts: { type: 'array', items: { $ref: '#/components/schemas/WarehouseReceipt' } },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        tags: ['Warehouse Receipts'],
        summary: 'Issue a warehouse receipt',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateReceiptRequest' } } },
        },
        responses: {
          201: {
            description: 'Receipt issued',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/WarehouseReceipt' } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/warehouse-receipts/{id}': {
      get: {
        tags: ['Warehouse Receipts'],
        summary: 'Get warehouse receipt by ID',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: {
            description: 'Receipt details',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/WarehouseReceipt' } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/warehouse-receipts/{id}/status': {
      patch: {
        tags: ['Warehouse Receipts'],
        summary: 'Update receipt status',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateReceiptStatusRequest' } } },
        },
        responses: {
          200: {
            description: 'Updated receipt',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/WarehouseReceipt' } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ── Loan Applications ─────────────────────────────────────────────────────
    '/api/loan-applications/public': {
      post: {
        tags: ['Loan Applications'],
        summary: 'Submit loan application (public)',
        description: 'Farmer self-service — no authentication required.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateLoanPublicRequest' } } },
        },
        responses: {
          201: {
            description: 'Loan application submitted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    refId:   { type: 'string' },
                    loan:    { $ref: '#/components/schemas/LoanApplication' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/loan-applications': {
      get: {
        tags: ['Loan Applications'],
        summary: 'List loan applications',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'approved', 'disbursed', 'repaid', 'defaulted', 'rejected'] } },
          { name: 'page',   in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit',  in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: {
            description: 'List of loan applications',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    loans:   { type: 'array', items: { $ref: '#/components/schemas/LoanApplication' } },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Loan Applications'],
        summary: 'Create loan application (authenticated)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateLoanRequest' } } },
        },
        responses: {
          201: {
            description: 'Loan application created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoanApplication' } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/loan-applications/{id}': {
      get: {
        tags: ['Loan Applications'],
        summary: 'Get loan application by ID',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: {
            description: 'Loan application details',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoanApplication' } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/loan-applications/{id}/status': {
      patch: {
        tags: ['Loan Applications'],
        summary: 'Update loan application status',
        description: 'Requires super_admin role.',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateLoanStatusRequest' } } },
        },
        responses: {
          200: {
            description: 'Updated loan application',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoanApplication' } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },

    // ── Notifications ─────────────────────────────────────────────────────────
    '/api/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'List notifications for current user',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'List of notifications',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success:       { type: 'boolean' },
                    notifications: { type: 'array', items: { $ref: '#/components/schemas/Notification' } },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    // ── Analytics ─────────────────────────────────────────────────────────────
    '/api/analytics': {
      get: {
        tags: ['Analytics'],
        summary: 'Get platform statistics',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Platform-wide stats',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AnalyticsStats' } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    // ── Export ────────────────────────────────────────────────────────────────
    '/api/export/applications': {
      get: {
        tags: ['Export'],
        summary: 'Export applications as CSV',
        description: 'Requires super_admin role. Returns a CSV file download.',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'state',  in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'CSV file',
            content: { 'text/csv': { schema: { type: 'string', format: 'binary' } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/export/centres': {
      get: {
        tags: ['Export'],
        summary: 'Export aggregation centres as CSV',
        description: 'Requires super_admin role.',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'CSV file',
            content: { 'text/csv': { schema: { type: 'string', format: 'binary' } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
  },
};

export default swaggerDocument;
