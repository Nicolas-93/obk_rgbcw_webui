function throttle(milliseconds, func) {
    let last_call = 0;
    return function () {
        let now = Date.now();
        if (last_call + milliseconds < now) {
            last_call = now;
            return func.apply(this, arguments);
        }
    };
}

function changeButtonColor(buttonId, colorClass) {
    const button = document.getElementById(buttonId);
    button.classList.remove('btn-unknown', 'btn-warning', 'btn-info', 'btn-on', 'btn-off');
    button.classList.add(colorClass);
}

function miredsToKelvin(temp_k) {
    return 1_000_000 / temp_k;
}

function kelvinToMireds(temp_m) {
    return 1_000_000 / temp_m;
}

function clamp(n, min, max) {
    if (n > max) return max;
    if (n < min) return min;
    return n;
}

function inferColorHS(picker, dest) {
    dest.color.saturation = picker.color.saturation;
    dest.color.hue = picker.color.hue;
}
