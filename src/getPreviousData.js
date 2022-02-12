const fetch = require('node-fetch');
const fs = require("fs");

let oldDna = [];

const writeMetaData = (_data) => {
    fs.writeFileSync(`./src/oldDna.json`, JSON.stringify(_data));
};

(async () => {
    async function getData(num){
        let url = `https://ipfs.io/ipfs/Qmer4JQBHDVAmtjTRD7o2rU7Hk7srXqLgRSVRywNnoAozA/${num}.json`;
    
        let options = {method: 'GET'};
    
        await fetch(url, options)
        .then(res => res.json())
        .then(json => oldDna.push(json['dna']))
        .catch(err => console.error('error:' + err));
    }
    for(let i = 1; i < 306; i++){
        await getData(i);
    }
    writeMetaData(oldDna);
    //console.log(oldDna.length);
})();
