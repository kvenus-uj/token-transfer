const fs = require('fs');
const idl = require('./token_transfer.json');

fs.writeFileSync('./src/idl.json', JSON.stringify(idl));