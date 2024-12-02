# Specification for the OpenTelemetry Reference Application

## General requirements

* There must be an uninstrumented and instrumented version of the application
* There must be a language specific CI action, that verifies that the application builds and runs in both variants
* The application must be runnable from a commandline interface
* There must be a Dockerfile to run the application within a containerized environment

## Service requirements "one service"

* The application must listen at port 8080 for HTTP requests by default. The port should be reconfigurable via the environment variable `APPLICATION_PORT`
* For handling the HTTP requests a library must be used for which an instrumentation library is available.
* The application must provide the endpoint `/fibonacci?n=<input>`, and the endpoint should return the following HTTP status codes and JSON result:
    * for a valid input (positive integer): status code `200` and `{"status": "ok", "n": <input>, "result": <fib(input)>}`, where `fib` is the fibonacci number for `<input>`
    * for an invalid input (not a number): status code `400` and `{"status": "error", "message": "<error message>"}`
    * for a server side error (negative integer): status code `500` and no JSON output
* The application must output the following log line using a language specific common logging framework
    * a INFO-level message for each HTTP request with a status code `<400`
    * a WARN-level message for each HTTP request with a status code between `400` and `499`, the message which will be included in the JSON result should also be included in the log line
    * a ERROR-level message for each HTTP request with a status code `>499`
    * a DEBUG-level message after each successful computation of a fibonacci number, which contains the computed result
* The code of the application must be split into two files:
    * an "app" file that contains the handling of the HTTP requests
    * a "lib" file that contains the implementation of the fibonacci function. There should be an outer function, which initially is only used to call a (private) function, which implements a recursive algorithm.

## Instrumentation requirements "one service", print to console
                  
The goal of this is to demonstrate the basic instrumentation of a service

* The OpenTelemetry SDK is initialized in the "app" file
  * the service name is set to "fibonacci-server" via code
  * an exporter writing telemetry to the console must be used
  * instrumentation libraries for the HTTP library must be loaded
  * the logging needs to be reconfigured to use OpenTelemetry to transport logs

* The OpenTelemetry API should be added to the "lib" file
  * add a span to the outer fibonacci function
  * add a metric to the outer fibonacci function that counts the function calls
  * add a child span to the inner/recursive fibonacci function

## Instrumentation requirements "one service", use OTLP

* Update the app file to use an OTLP exporter with a batch processor
* Point the exporter to a collector running on localhost using the default ports. Prefer HTTP over gRPC.

# Service requirements "2 services"

* Update the lib.js, such that the outer fibonacci function now takes two optional arguments called leftRemoteService and rightRemoteService. If those are not provided the existing inner function is used.
* If the optional arguments are provided a new function called remoteFibonacci should be called, this function delegates the computation of the next numbers to the remote services (except for the n = 0 and n = 1)
* Update the app.js that it reads LEFT_REMOTE_SERVICE and RIGHT_REMOTE_SERVICE environment variables and provides them to the fibonacci function, if they are provided.
* Make sure that the new function is instrumented with tracing as well.

# Advanced instrumentation requirements "2 services"

* if applicable add resource detectors for containers, host, os, etc. to the SDK initialization
* if applicable add a sampler to the configuration

# Other options

* Have a version that uses a MQ instead of HTTP
* Have a version with a browser/mobile/CLI client
* add more metrics types
* autoinstrument an uninstrumented version
* have a version that runs in k8s, with instrumented and uninstrumented components
* add error handling
* add troubleshooting
* add baggage