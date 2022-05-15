
const spawn = require('await-spawn');

class Hcitool{
    /**
     * Search for the a bluetooth device by mac addsress
     * @param {String} mac 
     * @returns {Promise<any>} result of the scan
     */
    static async searchForDevice(mac){
        let parameters = ['-i', 'hci0','name', mac];
        let process = spawn('hcitool', parameters);
        return process;
    }
}


module.exports = Hcitool;