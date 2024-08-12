CLIENT_ID=0475ef46-d731-411d-a653-d8ae202b7c08
CLIENT_SECRET=ta-secret.N^bQ9iBHf*B3Dnn_
AUDIENCE="https://fleet-api.prd.na.vn.cloud.tesla.com"
# Partner authentication token request
curl --request POST \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'grant_type=client_credentials' \
  --data-urlencode "client_id=$CLIENT_ID" \
  --data-urlencode "client_secret=$CLIENT_SECRET" \
  --data-urlencode 'scope=user_data openid vehicle_device_data vehicle_charging_cmds energy_device_data' \
  --data-urlencode "audience=$AUDIENCE" \
  'https://auth.tesla.com/oauth2/v3/token'

