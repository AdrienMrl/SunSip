#!/bin/bash

export TESLA_AUTH_TOKEN=$1

export VIN=$2
curl -X POST -H "Content-Type: application/json" -d "{\"charging_amps\": \"$3\"}" --cacert cert.pem \
    --header "Authorization: Bearer $TESLA_AUTH_TOKEN" \
    "https://localhost:4443/api/1/vehicles/$VIN/command/set_charging_amps" \
    | jq -r .
