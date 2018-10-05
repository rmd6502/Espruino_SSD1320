/* Copyright (c) 2014 Sam Sykes, Gordon Williams. See the file LICENSE for copying permission. */
/*
Module for the SSD1320 OLED controller in displays like the Crius CO-16
```
function go(){
 // write some text
 g.drawString("Hello World!",2,2);
 // write to the screen
 g.flip();
}
// I2C
I2C1.setup({scl:B6,sda:B7});

var g = require("SSD1320").connect(I2C1, go);
// or
var g = require("SSD1320").connect(I2C1, go, { address: 0x3C });

// SPI
var s = new SPI();
s.setup({mosi: B6, sck:B5, bits:9});
var g = require("SSD1320").connectSPI(s, A8, B7, go);
```
*/
var C = {
 OLED_WIDTH                 : 160,
 OLED_HEIGHT                : 32
};

// commands sent when initialising the display
var extVcc=false; // if true, don't start charge pump
var initCmds = new Uint16Array([
             0x0Ae, // 0 disp off
             0x0D5, // 1 clk div
             0x0C2, // 2 suggested ratio
             0x0A8, 0x000 + 31, // 3 set multiplex, height-1
             0x0D3,0x040, // 5 display offset
             0x0A2,0x000, // 7 start line
             0x0A0,      // 9 segment remap
             0x0C8,  // 10 COM Output scan direction
             0x0DA, 0x032, // 11 set compins, height==64 ? 0x02:0x02,
             0x081, 0x05A, // 13 set contrast
             0x0D9, 0x022, // 15 set phase length
             0x0Db, 0x030, // 17 set vcom detect
             0x0AD,0x010,  // 19 Internal Iref enable
             0x08D,0x001,  // 21 Internal Charge Pump
             0x0AC,0x000,  // 23 Charge pump 2
             0x0A4, // 25 display all on
             0x0A6, // 26 display normal (non-inverted)
             0x0Af // 27 disp on
            ]);
// commands sent when sending data to the display
var flipCmds = [
     0x021, // columns
     0x000, 0x000 + (C.OLED_WIDTH >> 1) - 1,
     0x022, // pages
     0x000, 0x000 + C.OLED_HEIGHT - 1 /* (height>>3)-1 */];

function update(options) {
  if (options) {
    if (options.height) {
      initCmds[4] = 0x000 + options.height-1;
      flipCmds[5] = 0x000 + (options.height)-1;
    }
    if (options.contrast!==undefined) initCmds[14] = 0x000 + options.contrast;
  }
}

exports.connect = function(spi, rst, callback, options) {
  update(options);
  var cs = options?options.cs:undefined;
  var oled = Graphics.createArrayBuffer(C.OLED_WIDTH,(initCmds[4] & 0xff)+1,4,{msb:true});

  if (cs) digitalWrite(cs,1);
  if (rst) {
    digitalWrite(rst, 1);
    digitalPulse(rst, 0, 10);
    digitalPulse(rst, 1, 0);
  }
  setTimeout(function() {
    if (cs) digitalWrite(cs,0);
    // configure the OLED
    spi.write(initCmds);
    if (cs) digitalWrite(cs,1);
    // if there is a callback, call it now(ish)
    if (callback !== undefined) setTimeout(callback, 10);
  }, 50);

  // write to the screen
  oled.flip = function() {
    // set how the data is to be sent (whole screen)
    if (cs) digitalWrite(cs,0);
    spi.write(flipCmds);
    var newBuf = new Uint16Array(this.buffer.length)
    for (var datum in this.buffer) {
      newBuf[datum] = this.buffer[datum] + 0x100;
    }
    spi.write(newBuf);
    if (cs) digitalWrite(cs,1);
  };

  // set contrast, 0..255
  oled.setContrast = function(c) {
    if (cs) cs.reset();
    spi.write(0x081, 0x000 + c);
    if (cs) cs.set();
  };

  // set off
  oled.off = function() {
    if (cs) cs.reset();
    spi.write(0x0AE);
    if (cs) cs.set();
  };

  // set on
  oled.on = function() {
    if (cs) cs.reset();
    spi.write(0x0AF);
    if (cs) cs.set();
  };

  // return graphics
  return oled;
};
