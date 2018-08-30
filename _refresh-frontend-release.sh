rm -rf dist/public
rm -rf omnitrack_research_kit_frontend.zip
mkdir -p dist/public
wget https://github.com/$(wget https://github.com/muclipse/omnitrack_backend_server/releases/latest -O - | egrep '/.*/.*/omnitrack_research_kit_frontend.zip' -o)
unzip omnitrack_research_kit_frontend.zip -d dist/public/
rm -rf omnitrack_research_kit_frontend.zip
