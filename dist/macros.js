"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    scaleAndCrop: function (width, height, gravity = 'Center') {
        return [`gravity|${gravity}`, `resize|${width}|${height}^`, `extent|${width}|${height}|+0|+${height / 2}`];
    }
};
//# sourceMappingURL=macros.js.map