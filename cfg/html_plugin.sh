
readonly FOLDER="$(dirname ${BASH_SOURCE[0]})"
echo $FOLDER

sed -i "s/new HtmlWebpackPlugin()/new HtmlWebpackPlugin({template: '.\/src\/index.tsx'})/" $FOLDER/dev.js
sed -i "s/index.html/index.tsx/g" $FOLDER/dist.js
