var oled;
var spi = new SPI();
require("Font8x12").add(Graphics);

function onInit() {
  const sclk = D24;
  const mosi = D23;
  const cs = D27;
  const res = D30;
  pinMode(sclk, 'output');
  digitalWrite(sclk, 0);
  pinMode(mosi, 'output');
  digitalWrite(mosi, 0);
  pinMode(cs, 'output');
  digitalWrite(cs, 1);
  pinMode(res, 'output');
  digitalWrite(res, 0);

  spi.setup({sck:sclk, mosi:mosi, bits:9, mode: 0, order: 'msb', baud:8000000});
  console.log("SPI");
  oled = require('SSD1320').connect(spi, res, function() {
    console.log("oled");
    oled.clear();
    oled.setColor(4);
    oled.fillRect(0,2,159,16);
    oled.setFont8x12();
    oled.setColor(15);
    oled.drawString("Hello, World", 20, 4);
    oled.setColor(9);
    oled.fillPoly([120,2,140,2,150,12,150,20,140,31]);
    oled.flip();
  }, {cs: cs});
}