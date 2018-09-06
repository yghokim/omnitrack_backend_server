ng build --prod --aot --sourceMap=false
rm -rf omnitrack_research_kit_frontend.zip
cd dist/public
zip -r omnitrack_research_kit_frontend.zip *
mv omnitrack_research_kit_frontend.zip ../../
