sed 's?\[REPOSITORY_LOCATION\]?'`pwd`'?' ./omnitrack_backend.service.template > ./omnitrack_backend.service
sed 's?\[PATH\]?'`pwd`'?' ./forever.json.template > ./forever.json
