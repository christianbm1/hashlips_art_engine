require('dotenv').config();
const path = require("path");
const pinataSDK = require('@pinata/sdk');
const pinata = pinataSDK(process.env.pinataApiKey, process.env.pinataSecret);
const isLocal = typeof process.pkg === "undefined";
const basePath = isLocal ? process.cwd() : path.dirname(process.execPath);
const fs = require("fs");



const imagesDir = path.join(basePath, "/build/images");
const jsonDir = path.join(basePath, "/build/json");
const pinataReadyDir = path.join(basePath, "/build/pinataReadyDir");

if (fs.existsSync(pinataReadyDir)) {
    fs.rmdirSync(pinataReadyDir, { recursive: true });
  }
  fs.mkdirSync(pinataReadyDir);


const getFiles = async (path) => {
    return fs
      .readdirSync(path)
      .filter((item) => !/(^|\/)\.[^\/\.]/g.test(item))
      .filter((item) => item != "_metadata.json")
      .map((i, index) => {
        return {
          id: parseInt(i.slice(0, -4)),
          name: i,
          filename: i,
          path: `${path}/${i}`
        };
      });
};

async function pinFileToIPFS(file){
    return await pinata.pinFileToIPFS(file, {}).then((result) => {
        //handle results here
        return result;
    }).catch((err) => {
        //handle error here
        console.log(err);
    });
}


async function pinJSONToIPFS(file){
    return await pinata.pinJSONToIPFS(file, {}).then((result) => {
        //handle results here
        return result;
    }).catch((err) => {
        //handle error here
        console.log(err);
    });
}

const timer = ms => new Promise(res => setTimeout(res, ms))

async function saveOutputLinks(data){
    let newData = [];
    let oldData;
    try {
        oldData = JSON.parse(fs.readFileSync('outputNftUriReady.json'));
    } catch (err) {
        oldData = [];
    }
    oldData.push({"cid": `ipfs://${data}`});
    writeMetaData(oldData);
}

const writeMetaData = (_data) => {
    fs.writeFileSync(`outputNftUriReady.json`, JSON.stringify(_data));
};

async function start(){
    let jsonFilesArr = await getFiles(jsonDir);

    jsonFilesArr.sort(function (a, b) {
        return a.id - b.id;
    });

    let imagesFilesArr = await getFiles(imagesDir);

    imagesFilesArr.sort(function (a, b) {
        return a.id - b.id;
    });

    //console.log(imagesFilesArr);

    let counter = 0;
    let cidsGenerated = [];
    let filesSuccessfullySaved = [];
    var today = new Date();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

    try{
        console.log(`Time Start: ${time}`);

        for(let i=0; i < jsonFilesArr.length; i++){
            let rawdata = fs.readFileSync(jsonFilesArr[i].path);

            let data = JSON.parse(rawdata);
            let x = imagesFilesArr.filter((item) => item.name == data.image.split('/')[3])[0]['path'];
            let pinataRes = await pinFileToIPFS(fs.createReadStream(x));
            data.image = `ipfs://${pinataRes.IpfsHash}`;
            data.date = pinataRes.Timestamp;
            cidsGenerated.push(pinataRes.IpfsHash);
            fs.writeFile(`${pinataReadyDir}/${i + 1}`, JSON.stringify(data), 'utf8', function (err) {
                if (err) return console.log(err);
            });
            await timer(2000);
            //console.log(`Json: ${data.name} with image ${x} was saved updated.`);
            //saveOutputLinks(pinataRes2.IpfsHash);
            filesSuccessfullySaved.push(jsonFilesArr[i].filename);
            counter++;
            console.log(`ID Saved: ${counter}`);
        }
        console.log(`The process has ended. It saved a total of ${counter} images to Pinata. Pinata responded by generating a total of ${cidsGenerated.length} HASH CIDs`);
        console.log(`The last file that was saved was: ${filesSuccessfullySaved[filesSuccessfullySaved.length - 1]}`);
        console.log(`Time Start: ${time}`);
        today = new Date();
        time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        console.log(`Time End: ${time}`);
    } catch(err){
        console.log(err);
        console.log(`There was an error.`);
        console.log(`The last file that was saved was: ${filesSuccessfullySaved[filesSuccessfullySaved.length - 1]}`);
        console.log(`Time Start: ${time}`);
        today = new Date();
        time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        console.log(`Time End: ${time}`);
    }
}
  
start();