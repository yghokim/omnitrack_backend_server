sudo apt-get install openjdk-8-jdk
echo "Choose java-8 in the list."
sudo update-alternatives -config java
cd ..
wget https://dl.google.com/android/repository/sdk-tools-linux-4333796.zip
sudo apt install unzip 
unzip sdk-tools-linux-4333796.zip -d android-sdk
rm -rf sdk-tools-linux-4333796.zip
export ANDROID_HOME=`pwd`/android-sdk
yes | $ANDROID_HOME/tools/bin/sdkmanager --licenses
echo "Now you are ready to build an Android application!"
