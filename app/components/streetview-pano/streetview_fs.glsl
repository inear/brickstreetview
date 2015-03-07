varying vec4 mPosition;
uniform sampler2D texture0;
//uniform sampler2D texture1;
//uniform sampler2D texture2;
uniform float time;
varying vec2 vUv;

uniform vec3 diffuse;
uniform vec3 fogColor;
uniform float fogNear;
uniform float fogFar;

void main() {

  //normal ground
  /*vec4 diffuseTex1 = texture2D( texture1, vUv );
  vec3 normalizedNormal = normalize(diffuseTex1.rgb);
  float DiffuseTerm = 1.0 - clamp(max(0.0, dot(normalizedNormal, vec3(0.0,1.0,0.0))), 0.0, 1.0);
  DiffuseTerm = 1.0-step(DiffuseTerm,0.98);
*/
  //normal sky
  //vec3 diffuseTex2 = texture2D( texture0, vUv ).xyz;
  //float grey = 1.0-(diffuseTex2.r + diffuseTex2.g + diffuseTex2.b)/3.0;
  //float DiffuseTerm2 = step(grey,0.5);

  //depth
  //vec3 diffuseTex3 = texture2D( texture2, vUv ).xyz;

  //diffuse
  vec4 diffuseTex0 = texture2D( texture0, vUv );
  //float grey = 1.0-(diffuseTex0.r + diffuseTex0.g + diffuseTex0.b)/3.0;
  //vec3 finalDiffuse = mix(diffuseTex0.rgb*vec3(0.8,0.9,0.8),vec3(0.8,0.9,0.8),diffuseTex3*diffuseTex3*0.1);
  vec3 finalDiffuse = diffuseTex0.rgb;



  //float thres = 1.0-step(0.1,diffuseTex1.b);
  //vec4(diffuseTex1,1.0);
  gl_FragColor = vec4( finalDiffuse,diffuseTex0.a);


  //float depth = gl_FragCoord.z / gl_FragCoord.w;
  //float fogFactor = smoothstep( fogNear, fogFar, depth );
  //gl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor );

}
