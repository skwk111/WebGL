precision highp float;
uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
varying vec2 vUv;

#define TAU 6.28318530718
#define MAX_ITER 5

vec3 hsv(float hue) {
    return clamp(abs(fract(hue + vec3(0, 2, 1) / 3.) * 6. - 3.) - 1., 0., 0.6) * mouse.x * mouse.y;
}

void main(void) {
    float t = time * .05;
    vec2 uv = vUv;

    vec2 p = mod(uv * TAU, TAU) - 250.0;
    vec2 i = vec2(p);
    float c = 1.0;
    float inten = .005;

    for(int n = 0; n < MAX_ITER; n++) {
        float t = t * (1.0 - (3.5 / float(n + 1)));
        i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
        c += 1.0 / length(vec2(p.x / (sin(i.x + t) / inten), p.y / (cos(i.y + t) / inten)));
    }
    c /= float(MAX_ITER);
    c = 1.17 - pow(c, 1.4);
    vec3 colour = vec3(pow(abs(c), 8.0));
    colour = clamp(colour + hsv(t), 0.0, 1.0);

    gl_FragColor = vec4(colour, 1.0);
}