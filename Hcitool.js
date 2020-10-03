
const Spawn = require('await-spawn');

class Hcitool{
    static async searchForDevice(mac){
        return spawn('hcitool', ['-i', 'hci0','name', mac]);
    }
}


module.exports = Hcitool;