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
