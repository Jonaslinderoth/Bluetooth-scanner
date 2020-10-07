
const Spawn = require('await-spawn');

class Hcitool{
    static async searchForDevice(mac){
        let parameters = ['-i', 'hci0','name', mac];
        let process = spawn('hcitool', parameters);
        return process;
    }
}


module.exports = Hcitool;