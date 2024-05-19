set -e

curl --request GET \
  --url http://localhost:8100/threads/1 \
  --header "Authorization: Bearer $TOKEN"
