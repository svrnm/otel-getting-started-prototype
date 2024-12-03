# Prototype for new OpenTelemetry Getting Started

This repositories contains prototypes and experiments for an improved Getting Started experience for the opentelemetry.io website.

If you want to learn more or contribute, go to https://github.com/open-telemetry/community/pull/2427

## Code Excerpts

The [docs](./docs) folder contains a simplified version of the getting started guide to have a playground for [code_excerpts](./tools), which is also used by [opentelemetry.io](https://github.com/open-telemetry/opentelemetry.io)

## Example code with "feature flags"

The [code](./code) folder contains implementations of the [./specification.md] in different languages (JavaScript, Go, _Java WIP_, ...). It uses C macros (!) and [`unifdef`](https://dotat.at/prog/unifdef/) to enable the evolution of the code throughout the steps from a shared code basis. Segments of the code can be turned on like features using macro symbols.

For example, in the following the default console transport for winston is replaced by the OpenTelemetry transport if the `ADD_BASE_INSTRUMENTATION` macro symbol is set:

```js
const logger = winston.createLogger({
  level: "info",
  transports: [
#ifndef ADD_BASE_INSTRUMENTATION
    new winston.transports.Console()
#else
    new OpenTelemetryTransportV3()
#endif
  ],
});
```