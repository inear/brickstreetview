varying vec4 mPosition;
uniform sampler2D texture0;
//uniform sampler2D texture1;
uniform sampler2D texture2;
uniform float time;
varying vec2 vUv;

uniform vec3 diffuse;
uniform vec3 fogColor;
uniform float fogNear;
uniform float fogFar;

void main() {

  //depth
  vec3 diffuseTex3 = texture2D( texture2, vUv ).xyz;

  //diffuse
  vec4 diffuseTex0 = texture2D( texture0, vUv );
  vec3 finalDiffuse = diffuseTex0.rgb;

  gl_FragColor = vec4( finalDiffuse,diffuseTex0.a);

  //gl_FragColor = vec4( mix( diffuseTex3.rgb*diffuseTex3.rgb,diffuseTex0.rgb,0.5), diffuseTex0.a);
}
