#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

UNIFDEF=unifdef
COLLECTOR_CONTAINER_NAME="fib_collector"
DOCKER_STOP="docker kill"

function start_collector() {
    # Check if the container is running
    if docker ps --filter "name=^${COLLECTOR_CONTAINER_NAME}$" --filter "status=running" --format "{{.Names}}" | grep -q "^${COLLECTOR_CONTAINER_NAME}$"; then
        echo "Container '${COLLECTOR_CONTAINER_NAME}' is already running."
    else
        docker network create fib_network
        docker run -d --rm --name ${COLLECTOR_CONTAINER_NAME} --network fib_network -p 4318:4318 -p 4317:4317 -v $(pwd)/../../collector/collector-config.yaml:/etc/otelcol-contrib/config.yaml otel/opentelemetry-collector-contrib:0.114.0
        # docker run -d --rm --name ${COLLECTOR_CONTAINER_NAME} --network fib_network -p 4317:18889 -p 4318:18890 -p 18888:18888 mcr.microsoft.com/dotnet/aspire-dashboard:9.0
    fi
}

function stop_collector() {
    if docker ps --filter "name=^${COLLECTOR_CONTAINER_NAME}$" --filter "status=running" --format "{{.Names}}" | grep -q "^${COLLECTOR_CONTAINER_NAME}$"; then
        ${DOCKER_STOP} ${COLLECTOR_CONTAINER_NAME}
        docker network rm fib_network
    fi
}

function check() {
    local retry_count=0
    local max_retries=15
    local response=0

    DIR=${1}
    # docker run -d --rm --name fib_remote --network fib_network -v ${PWD}/${DIR}:/code -w /code --entrypoint "/bin/bash" -e OTEL_EXPORTER_OTLP_ENDPOINT="http://fib_collector:4318" -e OTEL_SERVICE_NAME="fibonacci-remote" -e APPLICATION_PORT=8090 -p 8090:8090 golang:1.23 -c "./run.sh"
    docker run --rm --name fib_service --network fib_network -v ${PWD}/${DIR}:/code -w /code --entrypoint "/bin/bash" -e OTEL_EXPORTER_OTLP_ENDPOINT="http://fib_collector:4318" -e OTEL_SERVICE_NAME="fibonacci-server" -e LEFT_REMOTE_SERVICE="http://fib_remote:8090" -e RIGHT_REMOTE_SERVICE="http://fib_remote:8090"  -e APPLICATION_PORT=8080 -p 8080:8080 golang:1.23 -c "./run.sh"
    while true; do
        response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/fibonacci/?n=5)
        if [ "$response" -eq 200 ]; then
            echo -e "${GREEN}Service is up with 200 OK response!${NC}"
            break
        else
            echo "Waiting for service to start... Current response: $response"
        fi
        ((retry_count++))
        if [ "$retry_count" -ge "$max_retries" ]; then
            echo -e "${RED}Service did not start in time.${NC}"
            docker logs fib_service
            break
        fi
        sleep 2
    done
    ${DOCKER_STOP} fib_service fib_remote
}

function generate() {
    DIR=${1}
    shift 1
    UNIFDEF_WITH_VARS="${UNIFDEF} $(echo "$@")"
    ${UNIFDEF_WITH_VARS} _base/main.go > "${DIR}/main.go"
    ${UNIFDEF_WITH_VARS} _base/fibonacci.go > "${DIR}/fibonacci.go"
    if [ $DIR != "0-uninstrumented" ]; then
        ${UNIFDEF_WITH_VARS} _base/otel.go > "${DIR}/otel.go"
    fi
    npx prettier -w ${DIR}
    go vet ${DIR}/main.go ${DIR}/fibonacci.go
    check ${DIR}
}

start_collector

# rm 0-uninstrumented/go.mod
# cat _base/00-init.sh _base/99-run.sh > 0-uninstrumented/run.sh
# chmod +x 0-uninstrumented/run.sh
# generate 0-uninstrumented -UADD_BASE_INSTRUMENTATION -UADD_OTLP_EXPORTERS -UADD_REMOTE_COMPUTATION

# cat _base/00-init.sh _base/01-add-otel-dependencies.sh _base/99-run.sh > 1-instrumented/run.sh
# chmod +x 1-instrumented/run.sh
# generate 1-instrumented -DADD_BASE_INSTRUMENTATION -UADD_OTLP_EXPORTERS -UADD_REMOTE_COMPUTATION

cat _base/00-init.sh _base/01-add-otel-dependencies.sh _base/02-add-otlp-dependencies.sh _base/99-run.sh > 2-with-otlp/run.sh
chmod +x 2-with-otlp/run.sh
generate 2-with-otlp -DADD_BASE_INSTRUMENTATION -DADD_OTLP_EXPORTERS -UADD_REMOTE_COMPUTATION

# generate 3-distributed-services -DADD_BASE_INSTRUMENTATION -DADD_OTLP_EXPORTERS -DADD_REMOTE_COMPUTATION
# cat _base/00-init.sh _base/01-add-otel-dependencies.sh _base/02-add-otlp-dependencies.sh _base/03-add-http-client-dependencies.sh _base/99-run.sh > 3-distributed-services/run.sh
# chmod +x 3-distributed-services/run.sh

stop_collector