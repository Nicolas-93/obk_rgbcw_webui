const reqLimit = 70 /*ms*/
import * as utils from "./utils.js";
import iro from '@jaames/iro';
import { throttle } from "./utils.js";
import home from "../css/home.css";
import cards from "../css/cards.css";
import button from "../css/button.css";

let brightnessSlider = new iro.ColorPicker('#brightnessPicker', {
    width: 300,
    layout: [
        {
            component: iro.ui.Slider,
            options: {
                sliderType: 'value'
            }
        }
    ]
});
let wheelPicker = new iro.ColorPicker("#wheelPicker", {
    width: 300,
    layout: [
        {
            component: iro.ui.Wheel,
        },
    ]
});
let kelvinPicker = new iro.ColorPicker("#kelvinPicker", {
    width: 300,
    layoutDirection: 'vertical',
    layout: [
        {
            component: iro.ui.Slider,
            options: {
                sliderType: 'kelvin',
                minTemperature: 2000,
                maxTemperature: 6536
            }
        },
    ]
});

class Device {
    status;
    
    constructor() {
        
    }

    sendCmnd(cmd, arg) {
        let baseURL = "http://192.168.1.74";
        let url = baseURL + '/cm?cmnd=' + cmd + ' ' + (arg || '');
        console.log(url);
        return fetch(url, {
            method: 'GET'
        }).then((r) => r.json());
    }

    fetchStatus() {
        return this.sendCmnd("status").then(json => {
            this.status = json;
        });
    }

    getName() {
        return this.status['Status']['Topic'];
    }

    isPoweredOn() {
        return this.status['Status']['Power'] == "ON";
    }

    togglePower() {
        this.sendCmnd("power toggle");
    }

    getWifiStatus() {
        return this.status['StatusSTS']['Wifi'];
    }

    getNetworkStatus() {
        return this.status['StatusNET'];
    }

    getColorChannels() {
        return this.status['StatusSTS']['Color'].split(',').map(e => parseInt(e));
    }

    getColorRGB() {
        let [r, g, b] = this.getColorChannels();
        return {r: r, g: g, b: b};
    }

    @throttle(reqLimit)
    setColorRGB(hexColor) {
        console.log(this);
        this.sendCmnd("led_basecolor_rgb " + hexColor.slice(1));
    }

    getColorCW() {
        return utils.miredsToKelvin(this.status['StatusSTS']['CT']);
    }

    @throttle(reqLimit)
    setColorCW(kelvins) {
        this.sendCmnd("ct " + Math.floor(utils.kelvinToMireds(kelvins)));
    }

    getColorMode() {
        return this.getColorChannels().slice(3,5).some(e => e) ? 'CW' : 'RGB';
    }

    getDimmer() {
        // Sometimes Dimmer is greater than 100... clamping it to 100
        return utils.clamp(this.status['StatusSTS']['Dimmer'], 0, 100);
    }

    @throttle(reqLimit)
    setDimmer(value) {
        this.sendCmnd("Dimmer " + Math.floor(value));
    }
}

function updateInfos(dev) {
    let infos = document.getElementById("infos");
    infos.innerHTML = `
    AP name : <b>${dev.getWifiStatus().SSId}</b><br>
    Wifi RSSI : <b>-${dev.getWifiStatus().RSSI}dBm</b><br>
    Device MAC Address: <b>${dev.getNetworkStatus().Mac}</b><br>
    `;
}

function updatePowerButton(dev) {
    utils.changeButtonColor("btnPower", dev.isPoweredOn() ? "btn-on" : "btn-off");
}

function changeOBKName(dev) {
    let names = document.getElementsByClassName("dev-name");
    for (let name of names)
        name.innerText = `OpenBeken - ${dev.getName()}`;
}

let dev = new Device();
window.dev = dev;

window.onload = function () {
    dev.fetchStatus().then(() => {
        changeOBKName(dev);
        updatePowerButton(dev);
        updateInfos(dev);
    
        wheelPicker.color.rgb = dev.getColorRGB();
        // Value channel is adjusted by the brightness slider
        wheelPicker.color.setChannel('hsv', 'v', 100); 
        kelvinPicker.color.kelvin = dev.getColorCW();
        brightnessSlider.color.value = dev.getDimmer();
    
        utils.inferColorHS(dev.getColorMode() == "CW" ? kelvinPicker : wheelPicker, brightnessSlider);
    
        brightnessSlider.on('input:change', color => {
            dev.setDimmer(color.value);
        });
        wheelPicker.on('input:change', color => {
            dev.setColorRGB(color.hexString);
            utils.inferColorHS(wheelPicker, brightnessSlider);
        });
        kelvinPicker.on('input:change', color => {
            dev.setColorCW(color.kelvin);
            utils.inferColorHS(kelvinPicker, brightnessSlider);
        });        
    });

}
