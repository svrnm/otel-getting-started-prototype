npm init -y
npm install express winston
npm install @opentelemetry/sdk-node \
            @opentelemetry/instrumentation-http \
            @opentelemetry/instrumentation-express \
            @opentelemetry/winston-transport
node app.js
