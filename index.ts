// import * as bootstrap from 'bootstrap';
import './scss/custom.scss'

const timing_suggestions = [
    0.5, 1, 2, 5, 10, 15, 20, 30, 45,
    60, 60 * 2, 60 * 5, 60 * 15, 60 * 30,
    60 * 60 * 1, 60 * 60 * 1.5
];

function format_timing(seconds: number) {
    let minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;

    let hours = Math.floor(minutes / 60);
    minutes -= hours * 60;

    let seconds_string = seconds.toFixed(3);
    while(seconds_string.endsWith('0')) {
        seconds_string = seconds_string.slice(0, -1);
    }
    if(seconds_string.endsWith('.')) {
        seconds_string = seconds_string.slice(0, -1);
    }

    const components = [
        { value: hours, label: 'hour' },
        { value: minutes, label: 'minute' },
        { value: seconds_string, label: 'second' }
    ];

    return components.filter(component => component.value > 0).map(component => {
        return `${component.value} ${component.label}${component.value != 1 ? 's' : ''}`;
    }).join(', ');
}

let target_time: (null | number) = null;

function select_time_period(timing: number) {
    target_time = timing;
    document.getElementById('time-select-container')?.classList.add('shrink-slow');
    document.getElementById('time-test-container')?.classList.add('expand-slow');
    document.getElementById('restart-container')?.classList.add('expand-slow');

    const formatted_time = format_timing(timing);
    (<HTMLElement> document.getElementById('wait-period-in-header')).innerText = formatted_time;
}

function parse_time_period(time_period_string: string) {
    if(typeof time_period_string != 'string') {
        return null;
    }

    time_period_string = time_period_string.replace('minutes', 'm');
    time_period_string = time_period_string.replace('minute', 'm');
    time_period_string = time_period_string.replace('seconds', 's');
    time_period_string = time_period_string.replace('second', 's');
    time_period_string = time_period_string.replace(' ', '');

    if(/\d$/.test(time_period_string)) {
        time_period_string = time_period_string + 's';
    }

    if(!/^(\d+(\.\d+)?[ydhms])+$$/.test(time_period_string)) {
        // TODO: don't use window.alert()
        alert("Invalid time period, try 5m30s");
        return null;
    }

    const suffix_table: {[suffix: string]: (number | undefined)} = {
        'h': 60 * 60,
        'm': 60,
        's': 1
    };

    let total_value = 0;

    for(const match of (time_period_string.matchAll(/\d+(\.\d+)?[ydhms]/g))) {
        const suffix = match[0][match[0].length - 1];
        const suffix_multiplier = suffix_table[suffix]
        const number = parseFloat(match[0].substr(0, match[0].length - 1));

        if(typeof suffix_multiplier == 'undefined' || isNaN(number)) {
            alert("Invalid time period, try 5m30s");
            return null;
        }

        total_value += number * suffix_multiplier;
    }

    return total_value;
}

window.addEventListener('load', () => {
    const timing_selection_buttons = document.getElementById('time-slct-buttons');
    const time_select_custsom_outer = document.getElementById('time-slct-custom-outer');

    for(let timing of timing_suggestions) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-outline-primary m-1';
        button.innerText = format_timing(timing);

        button.addEventListener('click', e => {
            select_time_period(timing);
        });

        timing_selection_buttons?.insertBefore(button, <HTMLElement> time_select_custsom_outer?.parentElement);
    }

    document.getElementById('go-custom-btn')?.addEventListener('click', e => {
        let time_period = parse_time_period((<HTMLInputElement> document.getElementById('custom-time-input')).value);

        if(time_period !== null) {
            select_time_period(time_period);
        }
    });

    const begin_end_btn = <HTMLButtonElement> document.getElementById('begin-end-btn');
    let begin_btn_has_been_pressed = false;
    begin_end_btn.addEventListener('click', e => {
        if(!begin_btn_has_been_pressed) {
            begin_btn_has_been_pressed = true;
            do_begin_btn_pressed();
        } else {
            do_end_btn_pressed();
        }
    });

    document.getElementById('restart-btn')?.addEventListener('click', e => {
        // document.body.classList.add('shrink-slow');
        // setTimeout(() => window.location.reload(), 500);
        window.location.reload()
    });
});

let button_pressed_time: (null | number) = null;

function do_begin_btn_pressed() {
    const begin_end_btn = <HTMLButtonElement> document.getElementById('begin-end-btn');

    begin_end_btn.innerText = 'Stop';
    begin_end_btn.classList.remove('btn-success');
    begin_end_btn.classList.add('btn-danger');

    button_pressed_time = +new Date();
}

function assign_text_to_element(string: string, id: string) {
    (<HTMLElement> document.getElementById(id)).innerText = string;
}

function do_end_btn_pressed() {
    const end_time = +new Date();
    if(button_pressed_time === null) return;
    if(target_time === null) return;
    const dt = (end_time - button_pressed_time) / 1000;

    document.getElementById('time-test-container')?.classList.remove('expand-slow');
    document.getElementById('time-test-container')?.classList.add('shrink-slow');
    document.getElementById('time-results-container')?.classList.add('expand-slow');

    assign_text_to_element(format_timing(dt), 'results-1');
    assign_text_to_element(format_timing(Math.abs(dt - target_time)), 'results-2');
    assign_text_to_element(dt < target_time ? 'before' : 'after', 'results-3');
    assign_text_to_element(format_timing(target_time), 'results-4');
    assign_text_to_element((Math.abs(dt - target_time) / target_time * 100).toFixed(1), 'results-5');
}
