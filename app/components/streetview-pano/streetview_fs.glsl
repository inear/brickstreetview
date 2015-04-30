varying vec4 mPosition;
uniform sampler2D textureLego;
uniform sampler2D textureOriginal;
uniform float originalMix;
varying vec2 vUv;

void main() {

  //lego diffuse
  vec4 diffuseLegoTex = texture2D( textureLego, vUv ).rgba;
  vec4 originalDiffuseTex = texture2D( textureOriginal, vUv );

  vec4 finalDiffuse = mix(diffuseLegoTex,originalDiffuseTex,originalMix);

  gl_FragColor = finalDiffuse;
}
