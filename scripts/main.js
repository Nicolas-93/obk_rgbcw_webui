const reqLimit = 50 /*ms*/

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

function updateInfos(state) {
    let infos = document.getElementById("infos");
    infos.innerHTML = `
    AP name : <b>${state.StatusSTS.Wifi.SSId}</b><br>
    Wifi RSSI : <b>-${state.StatusSTS.Wifi.RSSI}dBm</b><br>
    Device MAC Address: <b>${state.StatusNET.Mac}</b><br>
    `;
}

function updatePowerButton(state) {
    changeButtonColor("btnPower", state.POWER == "ON" ? "btn-on" : "btn-off");
}

function changeOBKName(state) {
    names = document.getElementsByClassName("dev-name");
    for (let name of names) {
        name.innerText = `OpenBeken - ${state.Status.DeviceName}`;
    }
}

function togglePower() {
    sendCmnd("power toggle", updatePowerButton);
}

window.onload = function () {
    sendCmnd("status", req => {
        let state = req.StatusSTS;
        changeOBKName(req);
        updatePowerButton(state);
        updateInfos(req);

        
        let [r, g, b, c, w] = state.Color.split(',').map(e => parseInt(e));
        wheelPicker.color.rgb = {r: r, g: g, b: b};
        // Value channel is adjusted by the brightness slider
        wheelPicker.color.setChannel('hsv', 'v', 100); 

        kelvinPicker.color.kelvin = miredsToKelvin(state.CT);
        // Sometimes Dimmer is greater than 100... clamping it to 100
        brightnessSlider.color.value = clamp(state.Dimmer, 0, 100);

        if (c || w) {
            inferColorHS(kelvinPicker, brightnessSlider);
        }
        else {
            inferColorHS(wheelPicker, brightnessSlider);
        }

        // Add callbacks only after init
        brightnessSlider.on('input:change', throttle(reqLimit, color => {
            value = Math.floor(color.value);
            sendCmnd("Dimmer " + value);
        }));
        wheelPicker.on('input:change', throttle(reqLimit, color => {
            sendCmnd("led_basecolor_rgb " + color.hexString.slice(1));
            inferColorHS(wheelPicker, brightnessSlider);
        }));
        kelvinPicker.on('input:change', throttle(reqLimit, color => {
            sendCmnd("ct " + Math.floor(kelvinToMireds(color.kelvin)));
            inferColorHS(kelvinPicker, brightnessSlider);
        }));

        setInterval(() => {
            sendCmnd("status", (r) => {
                updateInfos(r)
            });
        }, 20_000);
    })
};
