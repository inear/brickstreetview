varying vec4 mPosition;
uniform sampler2D textureLego;
uniform sampler2D textureOriginal;
uniform sampler2D textureNormal;
uniform float originalMix;
uniform float normalMix;
varying vec2 vUv;

void main() {

  //lego diffuse
  vec4 diffuseLegoTex = texture2D( textureLego, vUv  );
  vec4 originalDiffuseTex = texture2D( textureOriginal, vec2(vUv.x, vUv.y-0.03) );
  vec4 originalNormalTex = texture2D( textureNormal, vec2(vUv.x, vUv.y+0.01) );

  vec4 finalDiffuse = mix(diffuseLegoTex,originalDiffuseTex,originalMix);
  finalDiffuse = mix(finalDiffuse,originalNormalTex,normalMix);

  gl_FragColor = finalDiffuse;
}
