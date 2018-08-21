sudo apt-get install openjdk-8-jdk
echo "Choose java-8 in the list."
sudo update-alternatives -config java
cd $HOME
wget https://dl.google.com/android/repository/sdk-tools-linux-4333796.zip
sudo apt install -y unzip 
unzip sdk-tools-linux-4333796.zip -d android-sdk
rm -rf sdk-tools-linux-4333796.zip
echo 'export ANDROID_HOME=$HOME/android-sdk' >> ~/.bashrc
yes | $HOME/android-sdk/tools/bin/sdkmanager --licenses
echo "Run > 'source ~/.bashrc' in prompt to complete."
