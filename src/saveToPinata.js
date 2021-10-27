require('dotenv').config();
const path = require("path");
const pinataSDK = require('@pinata/sdk');
const pinata = pinataSDK(process.env.pinataApiKey, process.env.pinataSecret);
const isLocal = typeof process.pkg === "undefined";
const basePath = isLocal ? process.cwd() : path.dirname(process.execPath);
const fs = require("fs");

const imagesDir = path.join(basePath, "/build/images");
const jsonDir = path.join(basePath, "/build/json");


const getFiles = async (path) => {
    return fs
      .readdirSync(path)
      .filter((item) => !/(^|\/)\.[^\/\.]/g.test(item))
      .filter((item) => item != "_metadata.json")
      .map((i, index) => {
        return {
          id: index + 1,
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
    console.log(oldData);
    writeMetaData(oldData);
}

const writeMetaData = (_data) => {
    fs.writeFileSync(`outputNftUriReady.json`, JSON.stringify(_data));
};

async function start(){
    let jsonFilesArr = await getFiles(jsonDir);
    let imagesFilesArr = await getFiles(imagesDir);

    for(let i=0; i < jsonFilesArr.length; i++){
        let rawdata = fs.readFileSync(jsonFilesArr[i].path);
        let data = JSON.parse(rawdata);
        let x = imagesFilesArr.filter((item) => item.name == data.image.split('/')[3])[0]['path'];
        let pinataRes = await pinFileToIPFS(fs.createReadStream(x));
        data.image = `ipfs://${pinataRes.IpfsHash}`;
        data.date = pinataRes.Timestamp;
        let pinataRes2 = await pinJSONToIPFS(data);

        await timer(2000);
        console.log(`Json: ${data.name} with Image ${x} was saved with CID: ipfs://${pinataRes2.IpfsHash}`);
        saveOutputLinks(pinataRes2.IpfsHash);
    }
}
  
start();