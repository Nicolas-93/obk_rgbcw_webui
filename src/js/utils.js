export function throttle(milliseconds) {
    let lastCall = 0;
    return function(target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = function(...args) {
            const now = Date.now();
            if (now - lastCall >= milliseconds) {
                lastCall = now;
                return originalMethod.apply(this, args);
            }
        };
        return descriptor;
    };
}

export function changeButtonColor(buttonId, colorClass) {
    const button = document.getElementById(buttonId);
    button.classList.remove('btn-unknown', 'btn-warning', 'btn-info', 'btn-on', 'btn-off');
    button.classList.add(colorClass);
}

export function miredsToKelvin(temp_k) {
    return 1_000_000 / temp_k;
}

export function kelvinToMireds(temp_m) {
    return 1_000_000 / temp_m;
}

export function clamp(n, min, max) {
    if (n > max) return max;
    if (n < min) return min;
    return n;
}

export function inferColorHS(picker, dest) {
    dest.color.saturation = picker.color.saturation;
    dest.color.hue = picker.color.hue;
}
