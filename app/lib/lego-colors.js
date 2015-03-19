module.exports.getColor = function( code ){
  return colorDict[code];
}

var colorDict = {};

var colorList = [
{
  name: 'Black',
  code: 0,
  color: 0x05131D,
  edge: 0x3F474C
},
{
  name: 'Blue',
  code: 1,
  color: 0x0561BC,
  edge: 0x0055C4
},
{
  name: 'Green',
  code: 2,
  color: 0x257A3E,
  edge: 0x238841
},
{
  name: 'Dark_Turquoise',
  code: 3,
  color: 0x00838F,
  edge: 0x008FAB
},
{
  name: 'Red',
  code: 4,
  color: 0xC91A09,
  edge: 0xD51A09
},
{
  name: 'Dark_Pink',
  code: 5,
  color: 0xC870A0,
  edge: 0xC26293
},
{
  name: 'Brown',
  code: 6,
  color: 0x583927,
  edge: 0x412D15
},
{
  name: 'Light_Gray',
  code: 7,
  color: 0x9BA19D,
  edge: 0x757B7C
},
{
  name: 'Dark_Gray',
  code: 8,
  color: 0x6D6E5C,
  edge: 0x4D4B43
},
{
  name: 'Light_Blue',
  code: 9,
  color: 0xB4D2E3,
  edge: 0xB4D2F3
},
{
  name: 'Bright_Green',
  code: 10,
  color: 0x4B9F4A,
  edge: 0x4BA94A
},
{
  name: 'Light_Turquoise',
  code: 11,
  color: 0x55A5AF,
  edge: 0x55A5BF
},
{
  name: 'Salmon',
  code: 12,
  color: 0xF2705E,
  edge: 0xF2806E
},
{
  name: 'Pink',
  code: 13,
  color: 0xFC97AC,
  edge: 0xFC97AC
},
{
  name: 'Yellow',
  code: 14,
  color: 0xF2CD37,
  edge: 0xE8C51F
},
{
  name: 'White',
  code: 15,
  color: 0xFFFFFF,
  edge: 0xA9A5A9
},
{
  name: 'Main_Colour',
  code: 16,
  color: 0x7F7F7F,
  edge: 0x333333
},
{
  name: 'Light_Green',
  code: 17,
  color: 0xC2DAB8,
  edge: 0xC2EAC8
},
{
  name: 'Light_Yellow',
  code: 18,
  color: 0xFBE696,
  edge: 0xFEE9A9
},
{
  name: 'Tan',
  code: 19,
  color: 0xE4CD9E,
  edge: 0xE2CBA0
},
{
  name: 'Light_Violet',
  code: 20,
  color: 0xC9CAE2,
  edge: 0xCACAEE
},
{
  name: 'Glow_In_Dark_Opaque',
  code: 21,
  color: 0xE0FFB0,
  edge: 0xA4C374,
  alpha: 250,
  luminance: 15
},
{
  name: 'Purple',
  code: 22,
  color: 0x81007B,
  edge: 0x91008B
},
{
  name: 'Dark_Blue_Violet',
  code: 23,
  color: 0x2032B0,
  edge: 0x2032C0
},
{
  name: 'Edge_Colour',
  code: 24,
  color: 0x7F7F7F,
  edge: 0x333333
},
{
  name: 'Orange',
  code: 25,
  color: 0xFE8A18,
  edge: 0xFF8820
},
{
  name: 'Magenta',
  code: 26,
  color: 0x923978,
  edge: 0x923988
},
{
  name: 'Lime',
  code: 27,
  color: 0xBBE90B,
  edge: 0xC0ED00
},
{
  name: 'Dark_Tan',
  code: 28,
  color: 0x958A73,
  edge: 0x756A53
},
{
  name: 'Bright_Pink',
  code: 29,
  color: 0xE4ADC8,
  edge: 0xF4ADC8
},
{
  name: 'Medium_Lavender',
  code: 30,
  color: 0xAC78BA,
  edge: 0xAF7CBE
},
{
  name: 'Lavender',
  code: 31,
  color: 0xE1D5ED,
  edge: 0xE5D9EF
},
{
  name: 'Trans_Black_IR_Lens',
  code: 32,
  color: 0x000000,
  edge: 0x05131D,
  alpha: 128
},
{
  name: 'Trans_Dark_Blue',
  code: 33,
  color: 0x0020A0,
  edge: 0x000064,
  alpha: 128
},
{
  name: 'Trans_Green',
  code: 34,
  color: 0x237841,
  edge: 0x237841,
  alpha: 128
},
{
  name: 'Trans_Bright_Green',
  code: 35,
  color: 0x56E646,
  edge: 0x9DA86B,
  alpha: 128
},
{
  name: 'Trans_Red',
  code: 36,
  color: 0xC91A09,
  edge: 0xD91A09,
  alpha: 128
},
{
  name: 'Trans_Dark_Pink',
  code: 37,
  color: 0xDF6695,
  edge: 0xA32A59,
  alpha: 128
},
{
  name: 'Trans_Neon_Orange',
  code: 38,
  color: 0xFF800D,
  edge: 0xFF7D10,
  alpha: 128
},
{
  name: 'Trans_Very_Light_Blue',
  code: 39,
  color: 0xC1DFF0,
  edge: 0x85A3B4,
  alpha: 128
},
{
  name: 'Trans_Black',
  code: 40,
  color: 0x635F52,
  edge: 0x171316,
  alpha: 128
},
{
  name: 'Trans_Medium_Blue',
  code: 41,
  color: 0x559AB7,
  edge: 0x196273,
  alpha: 128
},
{
  name: 'Trans_Neon_Green',
  code: 42,
  color: 0xC0FF00,
  edge: 0x84C300,
  alpha: 128
},
{
  name: 'Trans_Light_Blue',
  code: 43,
  color: 0xAEE9EF,
  edge: 0x72B3B8,
  alpha: 128
},
{
  name: 'Trans_Light_Purple',
  code: 44,
  color: 0x96709F,
  edge: 0x5A3463,
  alpha: 128
},
{
  name: 'Trans_Pink',
  code: 45,
  color: 0xFC97AC,
  edge: 0xB8718C,
  alpha: 128
},
{
  name: 'Trans_Yellow',
  code: 46,
  color: 0xF5CD2F,
  edge: 0xB49819,
  alpha: 128
},
{
  name: 'Trans_Clear',
  code: 47,
  color: 0xFCFCFC,
  edge: 0xA9ABB7,
  alpha: 128
},
{
  name: 'Trans_Purple',
  code: 52,
  color: 0xA5A5CB,
  edge: 0x6D6E5C,
  alpha: 128
},
{
  name: 'Trans_Neon_Yellow',
  code: 54,
  color: 0xDAB000,
  edge: 0xF5CD2F,
  alpha: 128
},
{
  name: 'Trans_Orange',
  code: 57,
  color: 0xF08F1C,
  edge: 0xED8B1A,
  alpha: 128
},
{
  name: 'Chrome_Antique_Brass',
  code: 60,
  color: 0x645A4C,
  edge: 0x281E10,
  material: 'chrome'
},
{
  name: 'Chrome_Blue',
  code: 61,
  color: 0x6C96BF,
  edge: 0x202A68,
  material: 'chrome'
},
{
  name: 'Chrome_Green',
  code: 62,
  color: 0x3CB371,
  edge: 0x007735,
  material: 'chrome'
},
{
  name: 'Chrome_Pink',
  code: 63,
  color: 0xAA4D8E,
  edge: 0x6E1152,
  material: 'chrome'
},
{
  name: 'Chrome_Black',
  code: 64,
  color: 0x1B2A34,
  edge: 0x000000,
  material: 'chrome'
},
{
  name: 'Rubber_Yellow',
  code: 65,
  color: 0xF5CD2F,
  edge: 0xB19705,
  material: 'rubber'
},
{
  name: 'Rubber_Trans_Yellow',
  code: 66,
  color: 0xCAB000,
  edge: 0xAD9600,
  alpha: 128,
  material: 'rubber'
},
{
  name: 'Rubber_Trans_Clear',
  code: 67,
  color: 0xFFFFFF,
  edge: 0xC3C3C3,
  alpha: 128,
  material: 'rubber'
},
{
  name: 'Very_Light_Orange',
  code: 68,
  color: 0xF3CF9B,
  edge: 0xF9DFAB
},
{
  name: 'Light_Purple',
  code: 69,
  color: 0xCD6298,
  edge: 0xDD72A8
},
{
  name: 'Reddish_Brown',
  code: 70,
  color: 0x582A12,
  edge: 0x391A08
},
{
  name: 'Light_Bluish_Gray',
  code: 71,
  color: 0xA0A5A9,
  edge: 0x777A85
},
{
  name: 'Dark_Bluish_Gray',
  code: 72,
  color: 0x6C6E68,
  edge: 0x484A4B
},
{
  name: 'Medium_Blue',
  code: 73,
  color: 0x5C9DD1,
  edge: 0x5A95DE
},
{
  name: 'Medium_Green',
  code: 74,
  color: 0x73DCA1,
  edge: 0xA1D390
},
{
  name: 'Speckle_Black_Copper',
  code: 75,
  color: 0x000000,
  edge: 0x595959,
  material: 'SPECKLE,VALUE,0xAE7A59,FRACTION,0.4,MINSIZE,1,MAXSIZE,3'
},
{
  name: 'Speckle_Dark_Bluish_Gray_Silver',
  code: 76,
  color: 0x635F61,
  edge: 0x595959,
  material: 'SPECKLE,VALUE,0x595959,FRACTION,0.4,MINSIZE,1,MAXSIZE,3'
},
{
  name: 'Light_Pink',
  code: 77,
  color: 0xFECCCF,
  edge: 0xFFCED2
},
{
  name: 'Light_Flesh',
  code: 78,
  color: 0xF6D7B3,
  edge: 0xF8D9B5
},
{
  name: 'Milky_White',
  code: 79,
  color: 0xFFFFFF,
  edge: 0xC3C3C3,
  alpha: 224
},
{
  name: 'Metallic_Silver',
  code: 80,
  color: 0xA5A9B4,
  edge: 0xA6AAB8,
  material: 'metal'
},
{
  name: 'Metallic_Green',
  code: 81,
  color: 0x899B5F,
  edge: 0x8EA15F,
  material: 'metal'
},
{
  name: 'Metallic_Gold',
  code: 82,
  color: 0x8C5C20,
  edge: 0xCD9E56,
  material: 'metal'
},
{
  name: 'Metallic_Black',
  code: 83,
  color: 0x1A2831,
  edge: 0x000000,
  material: 'metal'
},
{
  name: 'Medium_Dark_Flesh',
  code: 84,
  color: 0xCC702A,
  edge: 0xCE732C
},
{
  name: 'Dark_Purple',
  code: 85,
  color: 0x3F3691,
  edge: 0x4238A4
},
{
  name: 'Dark_Flesh',
  code: 86,
  color: 0x7C503A,
  edge: 0x7E533C
},
{
  name: 'Metallic_Dark_Gray',
  code: 87,
  color: 0x6D6E5C,
  edge: 0x5D5B53,
  material: 'metal'
},
{
  name: 'Blue_Violet',
  code: 89,
  color: 0x4C61DB,
  edge: 0x4F61E6
},
{
  name: 'Flesh',
  code: 92,
  color: 0xD09168,
  edge: 0xD3946A
},
{
  name: 'Light_Salmon',
  code: 100,
  color: 0xFEBABD,
  edge: 0xFFBCBF
},
{
  name: 'Violet',
  code: 110,
  color: 0x4354A3,
  edge: 0x4354B3
},
{
  name: 'Medium_Violet',
  code: 112,
  color: 0x6874CA,
  edge: 0x6A78D4
},
{
  name: 'Glitter_Trans_Dark_Pink',
  code: 114,
  color: 0xDF6695,
  edge: 0x9A2A66,
  alpha: 128,
  material: 'GLITTER,VALUE,0x923978,FRACTION,0.17,VFRACTION,0.2,SIZE,1'
},
{
  name: 'Medium_Lime',
  code: 115,
  color: 0xC7D23C,
  edge: 0xC9D43E
},
{
  name: 'Glitter_Trans_Clear',
  code: 117,
  color: 0xFFFFFF,
  edge: 0xC3C3C3,
  alpha: 128,
  material: 'GLITTER,VALUE,0xFFFFFF,FRACTION,0.08,VFRACTION,0.1,SIZE,1'
},
{
  name: 'Aqua',
  code: 118,
  color: 0xB3D7D1,
  edge: 0xB4DAD3
},
{
  name: 'Light_Lime',
  code: 120,
  color: 0xD9E4A7,
  edge: 0xDAE9A9
},
{
  name: 'Light_Orange',
  code: 125,
  color: 0xF9BA61,
  edge: 0xFDBF5D
},
{
  name: 'Glitter_Trans_Purple',
  code: 129,
  color: 0x640061,
  edge: 0x280025,
  alpha: 128,
  material: 'GLITTER,VALUE,0x8C00FF,FRACTION,0.3,VFRACTION,0.4,SIZE,1'
},
{
  name: 'Speckle_Black_Silver',
  code: 132,
  color: 0x000000,
  edge: 0x595959,
  material: 'SPECKLE,VALUE,0x595959,FRACTION,0.4,MINSIZE,1,MAXSIZE,3'
},
{
  name: 'Speckle_Black_Gold',
  code: 133,
  color: 0x000000,
  edge: 0xDBAC34,
  material: 'SPECKLE,VALUE,0xAE7A59,FRACTION,0.4,MINSIZE,1,MAXSIZE,3'
},
{
  name: 'Copper',
  code: 134,
  color: 0x964A27,
  edge: 0xA25331,
  material: 'pearlescent'
},
{
  name: 'Pearl_Light_Gray',
  code: 135,
  color: 0x9CA3A8,
  edge: 0x6C7378,
  material: 'pearlescent'
},
{
  name: 'Metal_Blue',
  code: 137,
  color: 0x5677BA,
  edge: 0x6F8ED4,
  material: 'pearlescent'
},
{
  name: 'Pearl_Light_Gold',
  code: 142,
  color: 0xDCBE61,
  edge: 0xDFBF64,
  material: 'pearlescent'
},
{
  name: 'Pearl_Dark_Gray',
  code: 148,
  color: 0x575857,
  edge: 0x424342,
  material: 'pearlescent'
},
{
  name: 'Pearl_Very_Light_Grey',
  code: 150,
  color: 0xBBBDBC,
  edge: 0xC3C7C5,
  material: 'pearlescent'
},
{
  name: 'Very_Light_Bluish_Gray',
  code: 151,
  color: 0xE6E3E0,
  edge: 0xE9E6E5
},
{
  name: 'Flat_Dark_Gold',
  code: 178,
  color: 0xB4883E,
  edge: 0xB1843A,
  material: 'pearlescent'
},
{
  name: 'Flat_Silver',
  code: 179,
  color: 0x898788,
  edge: 0x696768,
  material: 'pearlescent'
},
{
  name: 'Pearl_White',
  code: 183,
  color: 0xF2F3F2,
  edge: 0xFFFFFF,
  material: 'pearlescent'
},
{
  name: 'Bright_Light_Orange',
  code: 191,
  color: 0xF8BB3D,
  edge: 0xF8BB3D
},
{
  name: 'Bright_Light_Blue',
  code: 212,
  color: 0x86C1E1,
  edge: 0x89C5E6
},
{
  name: 'Rust',
  code: 216,
  color: 0xB31004,
  edge: 0xB91205
},
{
  name: 'Bright_Light_Yellow',
  code: 226,
  color: 0xFFF03A,
  edge: 0xFFF13B
},
{
  name: 'Sky_Blue',
  code: 232,
  color: 0x56BED6,
  edge: 0x59C3DA
},
{
  name: 'Rubber_Black',
  code: 256,
  color: 0x212121,
  edge: 0x595959,
  material: 'rubber'
},
{
  name: 'Dark_Blue',
  code: 272,
  color: 0x0D325B,
  edge: 0x083469
},
{
  name: 'Rubber_Blue',
  code: 273,
  color: 0x0033B2,
  edge: 0x001392,
  material: 'rubber'
},
{
  name: 'Dark_Green',
  code: 288,
  color: 0x184632,
  edge: 0x184A25
},
{
  name: 'Glow_In_Dark_Trans',
  code: 294,
  color: 0xBDC6AD,
  edge: 0xCFDBBF,
  alpha: 128,
  luminance: 15
},
{
  name: 'Pearl_Gold',
  code: 297,
  color: 0xCC9C2B,
  edge: 0xDDAE36,
  material: 'pearlescent'
},
{
  name: 'Dark_Brown',
  code: 308,
  color: 0x352100,
  edge: 0x3C2807
},
{
  name: 'Maersk_Blue',
  code: 313,
  color: 0x54A9C8,
  edge: 0x56ABCD
},
{
  name: 'Dark_Red',
  code: 320,
  color: 0x720E0F,
  edge: 0x790E0F
},
{
  name: 'Dark_Azure',
  code: 321,
  color: 0x1498D7,
  edge: 0x088DCD
},
{
  name: 'Medium_Azure',
  code: 322,
  color: 0x3EC2DD,
  edge: 0x3AB2C5
},
{
  name: 'Light_Aqua',
  code: 323,
  color: 0xBDDCD8,
  edge: 0xA0DEDA
},
{
  name: 'Rubber_Red',
  code: 324,
  color: 0xC40026,
  edge: 0x8A0000,
  material: 'rubber'
},
{
  name: 'Yellowish_Green',
  code: 326,
  color: 0xDFEEA5,
  edge: 0xE5F6AB
},
{
  name: 'Olive_Green',
  code: 330,
  color: 0x9B9A5A,
  edge: 0x9E9D5E
},
{
  name: 'Chrome_Gold',
  code: 334,
  color: 0xBBA53D,
  edge: 0xC2AB44,
  material: 'chrome'
},
{
  name: 'Sand_Red',
  code: 335,
  color: 0xD67572,
  edge: 0xDA7876
},
{
  name: 'Rubber_Orange',
  code: 350,
  color: 0xD06610,
  edge: 0x333333,
  material: 'rubber'
},
{
  name: 'Medium_Dark_Pink',
  code: 351,
  color: 0xF785B1,
  edge: 0xFB89B8
},
{
  name: 'Earth_Orange',
  code: 366,
  color: 0xFA9C1C,
  edge: 0xFEA11E
},
{
  name: 'Sand_Purple',
  code: 373,
  color: 0x845E84,
  edge: 0x8A648B
},
{
  name: 'Rubber_Light_Gray',
  code: 375,
  color: 0xC1C2C1,
  edge: 0x696969,
  material: 'rubber'
},
{
  name: 'Sand_Green',
  code: 378,
  color: 0xA0BCAC,
  edge: 0xA0BFAC
},
{
  name: 'Sand_Blue',
  code: 379,
  color: 0x597184,
  edge: 0x5B7488
},
{
  name: 'Chrome_Silver',
  code: 383,
  color: 0xE0E0E0,
  edge: 0xA4A4A4,
  material: 'chrome'
},
{
  name: 'Rubber_Dark_Blue',
  code: 406,
  color: 0x001D68,
  edge: 0x000A48,
  material: 'rubber'
},
{
  name: 'Rubber_Purple',
  code: 449,
  color: 0x81007B,
  edge: 0x570052,
  material: 'rubber'
},
{
  name: 'Fabuland_Brown',
  code: 450,
  color: 0xB67B50,
  edge: 0xB77B52
},
{
  name: 'Medium_Orange',
  code: 462,
  color: 0xFFA70B,
  edge: 0xFFAA0F
},
{
  name: 'Dark_Orange',
  code: 484,
  color: 0xA95500,
  edge: 0xAD5906
},
{
  name: 'Rubber_Lime',
  code: 490,
  color: 0xD7F000,
  edge: 0x639300,
  material: 'rubber'
},
{
  name: 'Magnet',
  code: 493,
  color: 0x656761,
  edge: 0x595959,
  material: 'metal'
},
{
  name: 'Electric_Contact_Alloy',
  code: 494,
  color: 0xD0D0D0,
  edge: 0x6E6E6E,
  material: 'metal'
},
{
  name: 'Electric_Contact_Copper',
  code: 495,
  color: 0xAE7A59,
  edge: 0x723E1D,
  material: 'metal'
},
{
  name: 'Rubber_Light_Bluish_Gray',
  code: 496,
  color: 0xA3A2A4,
  edge: 0x787878,
  material: 'rubber'
},
{
  name: 'Very_Light_Gray',
  code: 503,
  color: 0xE6E3DA,
  edge: 0xE9E6DD
},
{
  name: 'Rubber_Flat_Silver',
  code: 504,
  color: 0x898788,
  edge: 0x494748,
  material: 'rubber'
},
{
  name: 'Rubber_White',
  code: 511,
  color: 0xFAFAFA,
  edge: 0x676767,
  material: 'rubber'
},
];

for (var i = 0; i < colorList.length; i++) {
  var obj = colorList[i];
  colorDict[obj.code] = obj;
};


