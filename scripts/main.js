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


window.onload = function () {

    sendCmnd("status", req => {
        let state = req.StatusSTS;
        changeButtonColor("btnPower", state.POWER == "ON" ? "btn-success" : "btn-danger");
        
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
        brightnessSlider.on('color:change', throttle(reqLimit, function (color) {
            value = Math.floor(color.value);
            sendCmnd("Dimmer " + value);
        }));
        wheelPicker.on('color:change', throttle(reqLimit, function (color) {
            sendCmnd("led_basecolor_rgb " + color.hexString.slice(1));
            inferColorHS(wheelPicker, brightnessSlider);
        }));
        kelvinPicker.on('color:change', throttle(reqLimit, function(color) {
            sendCmnd("ct " + Math.floor(kelvinToMireds(color.kelvin)));
            inferColorHS(kelvinPicker, brightnessSlider);
        }))
    })
};
