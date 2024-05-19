set -e

curl --request POST \
  --url http://localhost:8100/threads \
  --header "Authorization: Bearer $TOKEN" \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data 'content=hello world'
