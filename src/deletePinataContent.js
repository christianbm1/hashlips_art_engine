require('dotenv').config();
const pinataSDK = require('@pinata/sdk');
const pinata = pinataSDK(process.env.pinataApiKey, process.env.pinataSecret);

const timer = ms => new Promise(res => setTimeout(res, ms))

async function currentPinnedFiles(){
    return await pinata.pinList({pageLimit: 1000, status: 'pinned'}).then((result) => {
        //handle results here
        return result;
    }).catch((err) => {
        //handle error here
        console.log(err);
    });
}
async function unpinFile(hashToUnpin){
    return await pinata.unpin(hashToUnpin).then((result) => {
        //handle results here
        return result;
    }).catch((err) => {
        //handle error here
        console.log(err);
    });
}

async function main(){
    let filesToDelete;
    let counter = 0;
    try{
        filesToDelete = await currentPinnedFiles();
        //console.log(filesToDelete.rows.length);
        for(var i = 0; i < filesToDelete.rows.length; i++){
            //console.log(filesToDelete.rows[i].ipfs_pin_hash);
            await unpinFile(filesToDelete.rows[i].ipfs_pin_hash);
            counter++;
            await timer(2000);
        }

        console.log(`Files unpinnd: ${counter}`);

    } catch(err) {
        console.log(err);
    }
}

main();