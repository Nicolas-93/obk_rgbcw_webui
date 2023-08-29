const reqLimit = 70 /*ms*/

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
    #status;
    
    constructor() {
        
    }

    //@throttle(reqLimit)
    #sendCmnd(cmd, arg) {
        let baseURL = "http://192.168.1.74";
        let url = baseURL + '/cm?cmnd=' + cmd + ' ' + (arg || '');
        console.log(url);
        return fetch(url, {
            method: 'GET'
        }).then((r) => r.json());

    }

    fetchStatus() {
        return this.#sendCmnd("status").then(json => {
            this.#status = json;
        });
    }

    get name() {
        return this.#status['Status']['Topic'];
    }

    get isPoweredOn() {
        return this.#status['Status']['Power'] == "ON";
    }

    togglePower() {
        this.#sendCmnd("power toggle");
    }

    get wifiStatus() {
        return this.#status['StatusSTS']['Wifi'];
    }

    get networkStatus() {
        return this.#status['StatusNET'];
    }

    get colorChannels() {
        return this.#status['StatusSTS']['Color'].split(',').map(e => parseInt(e));
    }

    get colorRGB() {
        let [r, g, b] = this.colorChannels;
        return {r: r, g: g, b: b};
    }

    set colorRGB(hexColor) {
        this.#sendCmnd("led_basecolor_rgb " + hexColor.slice(1));
    }

    get colorCW() {
        return miredsToKelvin(this.#status['StatusSTS']['CT']);
    }

    set colorCW(kelvins) {
        this.#sendCmnd("ct " + Math.floor(kelvinToMireds(kelvins)));
    }

    get colorMode() {
        this.colorChannels.slice(3,5).some(e => e) ? 'CW' : 'RGB';
    }

    get dimmer() {
        // Sometimes Dimmer is greater than 100... clamping it to 100
        return clamp(this.#status['StatusSTS']['Dimmer'], 0, 100);
    }

    set dimmer(value) {
        this.#sendCmnd("Dimmer " + Math.floor(value));
    }
}

function updateInfos(dev) {
    let infos = document.getElementById("infos");
    infos.innerHTML = `
    AP name : <b>${dev.wifiStatus.SSId}</b><br>
    Wifi RSSI : <b>-${dev.wifiStatus.RSSI}dBm</b><br>
    Device MAC Address: <b>${dev.networkStatus.Mac}</b><br>
    `;
}

function updatePowerButton(dev) {
    changeButtonColor("btnPower", dev.isPoweredOn ? "btn-on" : "btn-off");
}

function changeOBKName(dev) {
    let names = document.getElementsByClassName("dev-name");
    for (let name of names)
        name.innerText = `OpenBeken - ${dev.name}`;
}

let dev = new Device();

window.onload = function () {
    dev.fetchStatus().then(() => {
        changeOBKName(dev);
        updatePowerButton(dev);
        updateInfos(dev);
    
        wheelPicker.color.rgb = dev.colorRGB;
        // Value channel is adjusted by the brightness slider
        wheelPicker.color.setChannel('hsv', 'v', 100); 
        kelvinPicker.color.kelvin = dev.colorCW;
        brightnessSlider.color.value = dev.dimmer;
    
        inferColorHS(dev.colorMode == "CW" ? kelvinPicker : wheelPicker, brightnessSlider);
    
        brightnessSlider.on('input:change', color => {
            dev.dimmer = color.value
        });
        wheelPicker.on('input:change', color => {
            dev.colorRGB = color.hexString;
            inferColorHS(wheelPicker, brightnessSlider);
        });
        kelvinPicker.on('input:change', color => {
            dev.colorCW = color.kelvin;
            inferColorHS(kelvinPicker, brightnessSlider);
        });        
    });

}
