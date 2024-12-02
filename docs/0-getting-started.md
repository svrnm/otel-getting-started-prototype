# Getting Started

## Introduction

For this tutorial, you will be starting with an uninstrumented sample app. Uninstrumented means, that this app will initially not have any code, that will emit telemetry, such as traces, metrics and logs.

You will add the OpenTelemetry SDK to that application, and afterwards instrument the application by adding traces, metrics and logs. You will do that, for your dependencies and for your custom code.

## Sample application

Let's begin by setting up a new directory for your sample service:

```
mkdir fibonacci-server
cd fibonacci-server
```

### Dependencies

In that new directory, run the following command to initalize the new project and add all dependencies:

<?code-excerpt "js/_base/00-init.sh"?>
```
npm init -y
npm install express winston
```

### Code

The sample app consists of two files: an app and a library. 

First create the application file named `app.js`:

<?code-excerpt "js/0-uninstrumented/app.js"?>
```js
const express = require("express");
const winston = require("winston");
const { fibonacci } = require("./lib.js");

const logger = winston.createLogger({
  level: "info",
  transports: [new winston.transports.Console()],
});

const app = express();
const port = process.env.APPLICATION_PORT || 8080;

app.get("/fibonacci", (req, res) => {
  const n = parseInt(req.query.n, 10);

  if (isNaN(n)) {
    const errorMessage = "Invalid input: 'n' must be a number";
    logger.warn(errorMessage);
    return res.status(400).json({ status: "error", message: errorMessage });
  }

  try {
    const result = fibonacci(n);
    logger.debug(`Fibonacci computation successful: fib(${n}) = ${result}`);
    logger.info(`Request successful: fib(${n})`);
    res.status(200).json({ status: "ok", n, result });
  } catch (error) {
    logger.error(
      `Internal server error during Fibonacci computation: ${error.message}`,
    );
    res.sendStatus(500);
  }
});

// Start the server
app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
```

Next, create the library file named `lib.js`:

<?code-excerpt "js/0-uninstrumented/lib.js"?>
```js
function _fibonacciRecursive(num) {
  if (num <= 1) {
    return num;
  }
  return _fibonacciRecursive(num - 1) + _fibonacciRecursive(num - 2);
}

function fibonacci(n) {
  if (n < 0) {
    const error = new Error("Input must be a non-negative integer");
    throw error;
  }
  return _fibonacciRecursive(n);
}

module.exports = { fibonacci };
```

Test if the application works with the following command

<?code-excerpt "js/_base/99-run.sh"?>
```
node app.js
```

To verify that the service works as expected, either open <http://localhost:8080/fibonacci?n=5> in your web browser or run the following in the command line:

<?code-excerpt "common/curl.sh"?>
```
curl "http://localhost:8080/fibonacci?n=5"
```

## Instrumentation

Let's sprinkle in some otel. First add the required dependencies

<?code-excerpt "js/_base/01-add-otel-dependencies.sh"?>
```
npm install @opentelemetry/sdk-node \
            @opentelemetry/instrumentation-http \
            @opentelemetry/instrumentation-express \
            @opentelemetry/winston-transport
```