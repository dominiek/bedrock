# Bedrock API

![Run Tests](https://github.com/bedrockio/bedrock-core/workflows/Tests/badge.svg)

## API Documentation

See http://localhost:2200/docs for full documentation on this API (requires running the web interface).

## Directory Structure

- `.env` - Default configuration values (override via environment)
- `package.json` - Configure dependencies
- `src/**/__tests__` - Unit tests
- `src/lib` - Platform specific library files
- `src/utils` - Various utilities, helpers and middleware extensions
- `src/routes` - API Routes
- `src/routes/__openapi__` - OpenAPI descriptions for use in documentation portal
- `src/models` - Mongoose ORM models (code and JSON) - [Models Documentation](./src/models)
- `src/app.js` - Entrypoint into API (does not bind, so can be used in unit tests)
- `src/index.js` - Launch script for the API
- `emails/dist` - Prebuild emails templates (dont modify => modify emails/src and run `yarn emails`)
- `emails/src` - Email templates
- `scripts` - Scripts and jobs

## Install Dependencies

Ensure Node.js version uniformity using Volta:

```
curl -sSLf https://get.volta.sh | bash
```

Install dependencies: (will install correct Node.js version)

```
yarn install
```

## Testing & Linting

```
yarn test
```

## Running in Development

Code reload using nodemon:

```
yarn start
```

This command will automatically populate MongoDB fixtures when and empty DB is found.

## Configuration

All configuration is done using environment variables. The default values in `.env` can be overwritten using environment variables.

- `BIND_HOST` - Host to bind to, defaults to `"0.0.0.0"`
- `BIND_PORT` - Port to bind to, defaults to `2300`
- `MONGO_URI` - MongoDB URI to connect to, defaults to `mongodb://localhost/bedrock_dev`
- `JWT_SECRET` - JWT secret used for token signing and encryption, defaults to `[change me]`
- `ADMIN_NAME` - Default dashboard admin user name `admin`
- `ADMIN_EMAIL` - Default dashboard admin user `admin@bedrock.foundation`
- `ADMIN_PASSWORD` - Default dashboard admin password `[change me]`
- `APP_NAME` - Default product name to be used in emails `Bedrock`
- `APP_URL` - URL for app defaults to `http://localhost:2200`
- `POSTMARK_FROM` - Reply email address `no-reply@bedrock.foundation`
- `POSTMARK_APIKEY` - APIKey for Postmark `[change me]`
- `UPLOADS_STORE` - Method for uploads. `local` or `gcs` (Google Cloud Storage)
- `UPLOADS_GCS_BUCKET` - GCS bucket for uploads
- `SENTRY_DSN` - Sentry error monitoring credentials

## Building the Container

```
docker build -t bedrock-api .
```

See [../../deployment](../../deployment/) for more info

## Configuring Background Jobs

The API provides a simple Docker container for running Cronjobs. The Cron schedule can be configured in `scripts/jobs-entrypoint.sh`. Tip: use https://crontab.guru/ to check your cron schedule.

```
docker build -t bedrock-api-jobs -f Dockerfile.jobs .
```

## Reloading DB Fixtures

DB fixtures are loaded automatically in the dev environment. However, using this command you can force reload the DB:

```
./scripts/fixtures/reload
```

_Note: In the staging environment this script can be run by obtaining a shell into the API CLI pod (See Deployment)_

## Multi Tenancy

The API is "multi tenant ready" and can be modified to accommodate specific tenancy patterns:

- Single Tenant per platform deployment: Organization model could be removed.
- Basic Multi Tenancy: Each request will result in a "Default" organization to be set. This can be overriden using the "Organization" header.
- Managed Multi Tenancy: Manually add new organizations in the "Organizations" CRUD UI in the dashboard. Suitable for smaller enterprise use cases.
- Self Serve Multi Tenancy; Requires changes to the register mechanism to create a new Organization for each signup. Suitable for broad SaaS.
- Advanced Multi Tenancy; Allow users to self signup and also be invited into multiple organizations. Requires expaning the user model and invite mechanism to allow for multiple organizations.

Example Create API call with multi tenancy enabled:

```js
const { authenticate, fetchUser } = require('../utils/middleware/authenticate');
const { requirePermissions } = require('../utils/middleware/permissions');

router
  .use(authenticate({ type: 'user' }))
  .use(fetchUser)
  // Only allow access to users that have write permissions for this organization
  .use(requirePermissions({ endpoint: 'shops', level: 'write', context: 'organization' }))
  .post(
    '/',
    validate({
      body: schema,
    }),
    async (ctx) => {
      const shop = await Shop.create({
        // Set the organization for each object created
        organization: ctx.state.organization,
        ...ctx.request.body,
      });
      ctx.body = {
        data: shop,
      };
    }
  );
```

## Updating E-Mail Templates

E-mail templates can be found in `emails/src`. When changes are made, run the following command to optimize the emails for mail readers:

```
yarn emails
```

## Logging

We are using https://getpino.io/ as logging library, which we have wrapped to ensure that it optimized to work with https://cloud.google.com/logging/ which requires certain fields to be set for http logging.

The http logging is center to rest api logging, as all executed code (besides a few exeptions like scripts/jobs) are executed in the context of a http request. Making it important to be able to "trace" (https://cloud.google.com/trace/) the log output to a given request.

By default the log level in `development` is set to info, but can be overwritten via env flags (LOG_LEVEL).

To access the logger you can use the `ctx.logger` or if don't have easy access to the ctx (koa request context) then do

```
const { createLogger } = require('../utils/logging');

// do this
function someWork() {
  const logger = createLogger();
  logger.info("something")
}

// don't create the logger outside the function
// if it can be avoid (not always possible) as no trace context can be provide
const logger = createLogger()
```

## Auto-generating API Documentation

Good API documentation needs love, so make sure to take the time to describe parameters, create examples, etc.

There's a script that automatically generates an OpenAPI definition for any added routes.

Run:

```
node scripts/generate-openapi.js
```

The format in `src/routes/__openapi__` is using a slimmed down version of the OpenAPI spec to make editing easier. API calls can be defined in the `paths` array and Object definitions can be defined in the `objects` array.

Here's an example of an API call definition:

```json
{
  "method": "POST",
  "path": "/login",
  "requestBody": [
    {
      "name": "email",
      "description": "E-mail address of the user trying to log in",
      "required": true,
      "schema": {
        "type": "string",
        "format": "email"
      }
    },
    {
      "name": "password",
      "description": "Password associated with the e-mail address",
      "required": true,
      "schema": {
        "type": "string"
      }
    }
  ],
  "responseBody": [
    {
      "name": "data.token",
      "description": "JWT token that can be used to authenticate user",
      "schema": {
        "type": "string"
      }
    }
  ],
  "examples": [
    {
      "name": "A new login from John Doe",
      "requestBody": {
        "email": "john.doe@gmail.com",
        "password": "AN$.37127"
      },
      "responseBody": {
        "data": {
          "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1ZTZhOWMwMDBmYzY3NjQ0N2RjOTkzNmEiLCJ0eXBlIjoidXNlciIsImtpZCI6InVzZXIiLCJpYXQiOjE1ODk1NjgyODQsImV4cCI6MTU5MjE2MDI4NH0.I0DhLK9mBHCy8sJglzyLHYQHFfr34UYyCFyTaEgFFG"
        }
      }
    }
  ]
}
```

All information in `src/routes/__openapi__` is exposed through the API and used by the Markdown-powered documentation portal in `/services/web/src/docs`.

See [../../services/web](../../services/web) for more info on customizing documentation.
