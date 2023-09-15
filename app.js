import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

import fragment from './shaders/fragment.glsl';
import fragment1 from './shaders/fragment1.glsl';
import vertex from './shaders/vertex.glsl';
import vertex1 from './shaders/vertex1.glsl';

// import {DotScreenShader} from './js/customShader';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
//PROBLEM unreal bloom pass current not importing
// import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

//might have 2 change this on cargo
import env from './assets/env.jpeg';


export default class Sketch{
  constructor(options){
      this.scene = new THREE.Scene();

    this.container = options.dom;
    //add event listener to container
    this.container.addEventListener('click', this.onMouseClick.bind(this));
    //Rotation animation mixer
    // Initialize AnimationMixer
    this.mixer = new THREE.AnimationMixer(this.blob3); // Replace with your model variable
    // this.rotationAction = this.mixer.clipAction(new THREE.AnimationClip()); // Create an empty clip action

    // this.mixer = new THREE.AnimationMixer(this.yourModel);

    console.log(this.container);
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.renderer = new THREE.WebGLRenderer( { antialias: true } );
    this.renderer.setSize(window.innerWidth, window.innerHeight );
    this.renderer.setClearColor(0xeeeeee, 1);
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.container.appendChild( this.renderer.domElement );

    //Set up camera
    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      10 );
    // this.camera.position.z = 1.5;
    this.camera.position.set(-1, 0, 0);
    // this.camera.fov = 110 
    this.camera.updateProjectionMatrix();
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    // this.controls.enableZoom = false;

    this.assetLoader = new GLTFLoader();
    //setting exposure from env map
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.8;

    this.addMesh();
    this.loadAssets();

    this.time = 0;

    this.initPost();
    this.addLights();
    this.setUpRaycaster();
    this.clock = new THREE.Clock();
    this.resize();
    this.render();
    this.resize_bound = this.resize.bind(this);
    this.setupResize();
  }

  setupResize() {
    window.addEventListener("resize", this.resize_bound);
  }

resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  initPost() {
    // postprocessing

    this.params = {
      threshold: 0.1,
      strength: 2.,
      radius: 0.8,
      exposure: 1
    };

    this.renderScene = new RenderPass( this.scene, this.camera );

				// this.bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
				// this.bloomPass.threshold = this.params.threshold;
				// this.bloomPass.strength = this.params.strength;
				// this.bloomPass.radius = this.params.radius;

        // this.outputPass = new OutputPass();

				this.composer = new EffectComposer( this.renderer );
				this.composer.addPass( this.renderScene );
				// this.composer.addPass( this.bloomPass );
				// composer.addPass( outputPass );

    //Dot screen is too heavy for this project
    // this.composer = new EffectComposer( this.renderer );
    // this.composer.addPass( new RenderPass( this.scene, this.camera ) );

    // const effect1 = new ShaderPass( DotScreenShader );
    // effect1.uniforms[ 'scale' ].value = 8;
    // this.composer.addPass( effect1 );
  }

  addMesh() {
    this.cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256,{
      format: THREE.RGBAFormat,
      generateMipmaps: true,
      minFilter: THREE.LinearMipMapLinearFilter,
      encoding: THREE.sRGBEncoding
    })

    this.cubeCamera = new THREE.CubeCamera(0.1,10., this.cubeRenderTarget);

    this.geometry = new THREE.SphereBufferGeometry(1.5, 32, 32);
    this.material = new THREE.MeshNormalMaterial({side: THREE.DoubleSide});
    this.material = new THREE.ShaderMaterial({
      fragmentShader: fragment,
      vertexShader: vertex,
      uniforms:{
        progress: { type: "f", value: 0 },
        time: { value: 0 },
        resolution: { value: new THREE.Vector4() },
      },
      side: THREE.DoubleSide
    })
    this.mesh = new THREE.Mesh( this.geometry, this.material );
    this.scene.add( this.mesh );

    let geo = new THREE.SphereBufferGeometry(0.25, 60, 60);
    this.mat = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_0ES_standard_derivatives : enable"
      },
      fragmentShader: fragment1,
      vertexShader: vertex1,
      uniforms:{
        time: { value: 0 },
        tCube: { value: 0 },
        resolution: { value: new THREE.Vector4() },

      },
      side: THREE.DoubleSide
    })

    this.smallSphere = new THREE.Mesh(geo,this.mat);
    // this.smallSphere.setPosition(new THREE.Vector(0.,0.5,1.));
    this.scene.add(this.smallSphere);
    this.smallSphere.position.y = .2;
  }

  loadAssets() {
      this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      this.pmremGenerator.compileEquirectangularShader();
  
      //File paths
      this.blob1 = new URL('https://files.cargocollective.com/c1171088/blob-1.glb', import.meta.url);
      console.log(this.blob1);
        this.blob2 = new URL('https://files.cargocollective.com/c1171088/blob-2.glb', import.meta.url);
        this.blob3 = new URL('https://files.cargocollective.com/c1171088/blob-3.glb', import.meta.url);
        this.model = new URL('https://files.cargocollective.com/c1171088/human-distort-noise-0.5.glb', import.meta.url); //./assets/blob-2.glb
        // this.blobModels = [];
        // this.blobPaths = ['./assets/blob-1.glb','./assets/blob-2.glb','./assets/blob-3.glb' ];
  
      this.envMap = new THREE.TextureLoader().load(env, (texture) => {
        this.envMap = this.pmremGenerator.fromEquirectangular(texture).texture;
        // this.envMap.mapping = THREE.EquirectangularReflectionMapping; // reflective mapping
        // console.log(envMap);
  
        // this.scene.env
  
        this.pmremGenerator.dispose();
  
        // console.log(this.blobModels[2]);
  
        //====== Loading human model ======//
        this.assetLoader.load(this.model.href, (gltf) => {
          this.human = gltf.scene.children[0];
          this.human.scale.set(0.5, 0.5, 0.5);
          // console.log(this.human);
          this.human.geometry.center()
          this.human.rotation.set(1.5, 0, 0);
          this.human.position.set(0., -.5, 0); //back, down ,right
  
          this.scene.add(this.human);
  
          // console.log(this.blobPaths);
  
          // this.scene.add(this.human);
  
          this.m = new THREE.MeshStandardMaterial({
            metalness: 1.,
            roughness: 0.28
          })
  
          this.m.envMap = this.envMap;
  
          //rotating the texture by rotating the UVs around
          this.m.onBeforeCompile = (shader) => {
            shader.uniforms.uTime = { value: 0 };
  
            shader.fragmentShader = `
            uniform float uTime;
            mat4 rotationMatrix(vec3 axis, float angle) {
              axis = normalize(axis);
              float s = sin(angle);
              float c = cos(angle);
              float oc = 1.0 - c;
              
              return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                          oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                          oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                          0.0,                                0.0,                                0.0,                                1.0);
          }
          
          vec3 rotate(vec3 v, vec3 axis, float angle) {
            mat4 m = rotationMatrix(axis, angle);
            return (m * vec4(v, 1.0)).xyz;
          }
            ` + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace(
              `import envmap_physical_pars_fragment from './ShaderChunk/envmap_physical_pars_fragment.glsl.js'`,
              `#ifdef USE_ENVMAP
  
              vec3 getIBLIrradiance( const in vec3 normal ) {
            
                #ifdef ENVMAP_TYPE_CUBE_UV
            
                  vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
            
                  vec4 envMapColor = textureCubeUV( envMap, worldNormal, 1.0 );
            
                  return PI * envMapColor.rgb * envMapIntensity;
            
                #else
            
                  return vec3( 0.0 );
            
                #endif
            
              }
            
              vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
            
                #ifdef ENVMAP_TYPE_CUBE_UV
            
                  vec3 reflectVec = reflect( - viewDir, normal );
            
                  // Mixing the reflection with the normal is more accurate and keeps rough objects from gathering light from behind their tangent plane.
                  reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
            
                  reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
  
                  reflectVec *= rotate( reflectVec, vec3( 0.0, 1.0, 0.0 ), uTime * .1);
            
                  vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );
            
                  return envMapColor.rgb * envMapIntensity;
            
                #else
            
                  return vec3( 0.0 );
            
                #endif
            
              }
            
              #ifdef USE_ANISOTROPY
            
                vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
            
                  #ifdef ENVMAP_TYPE_CUBE_UV
            
                    // https://google.github.io/filament/Filament.md.html#lighting/imagebasedlights/anisotropy
                    vec3 bentNormal = cross( bitangent, viewDir );
                    bentNormal = normalize( cross( bentNormal, bitangent ) );
                    bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
            
                    return getIBLRadiance( viewDir, bentNormal, roughness );
            
                  #else
            
                    return vec3( 0.0 );
            
                  #endif
            
                }
            
              #endif
            
            #endif`
            )
            this.m.userData.shader = shader;
          }
          this.human.material = this.m;
          
          // ======= Loading blob1 ====== //
          this.assetLoader.load(this.blob1.href, (gltf) => {
            this.blob1 = gltf.scene.children[0];
            console.log(this.blob1);
            
            this.blob1.scale.set(0.5, 0.5, 0.5);
            this.blob1.geometry.center()
            this.blob1.rotation.set(0., 0.7, 0);
            this.blob1.position.set(-0.9,-1.5,-0.5); //back, left ,down
            this.mat1 = new THREE.MeshStandardMaterial({
              metalness: 1.,
              roughness: 0.28
            })
  
            this.mat1.envMap = this.envMap;
  
            //rotating the texture by rotating the UVs around
            this.mat1.onBeforeCompile = (shader) => {
              shader.uniforms.uTime = { value: 0 };
  
              shader.fragmentShader = `
              uniform float uTime;
              mat4 rotationMatrix(vec3 axis, float angle) {
                axis = normalize(axis);
                float s = sin(angle);
                float c = cos(angle);
                float oc = 1.0 - c;
                
                return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                            oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                            oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                            0.0,                                0.0,                                0.0,                                1.0);
            }
            
            vec3 rotate(vec3 v, vec3 axis, float angle) {
              mat4 m = rotationMatrix(axis, angle);
              return (m * vec4(v, 1.0)).xyz;
            }
              ` + shader.fragmentShader;
      //envmap_physical_pars_fragment: envmap_physical_pars_fragment`
              shader.fragmentShader = shader.fragmentShader.replace(
                `import envmap_physical_pars_fragment from './ShaderChunk/envmap_physical_pars_fragment.glsl.js'`,
                `#ifdef USE_ENVMAP
  
                vec3 getIBLIrradiance( const in vec3 normal ) {
              
                  #ifdef ENVMAP_TYPE_CUBE_UV
              
                    vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
              
                    vec4 envMapColor = textureCubeUV( envMap, worldNormal, 1.0 );
              
                    return PI * envMapColor.rgb * envMapIntensity;
              
                  #else
              
                    return vec3( 0.0 );
              
                  #endif
              
                }
              
                vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
              
                  #ifdef ENVMAP_TYPE_CUBE_UV
              
                    vec3 reflectVec = reflect( - viewDir, normal );
              
                    // Mixing the reflection with the normal is more accurate and keeps rough objects from gathering light from behind their tangent plane.
                    reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
              
                    reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
  
                    reflectVec *= rotate( reflectVec, vec3( 0.0, 1.0, 0.0 ), uTime * .1);
              
                    vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );
              
                    return envMapColor.rgb * envMapIntensity;
              
                  #else
              
                    return vec3( 0.0 );
              
                  #endif
              
                }
              
                #ifdef USE_ANISOTROPY
              
                  vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
              
                    #ifdef ENVMAP_TYPE_CUBE_UV
              
                      // https://google.github.io/filament/Filament.md.html#lighting/imagebasedlights/anisotropy
                      vec3 bentNormal = cross( bitangent, viewDir );
                      bentNormal = normalize( cross( bentNormal, bitangent ) );
                      bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
              
                      return getIBLRadiance( viewDir, bentNormal, roughness );
              
                    #else
              
                      return vec3( 0.0 );
              
                    #endif
              
                  }
              
                #endif
              
              #endif`
              )
              this.mat1.userData.shader = shader;
            }
            this.blob1.material = this.mat1;
            this.human.add(this.blob1);
          });
  
          //======= Loading blob2 ====== //
          this.assetLoader.load(this.blob2.href, (gltf) => {
            this.blob2 = gltf.scene.children[0];
            this.blob2.scale.set(0.5, 0.5, 0.5);
            this.blob2.geometry.center()
            // this.blob2.rotation.set(0., 0.7, 0);
            this.blob2.position.set(0.9,1.8,-1.3); //back, down ,right
            this.mat2 = new THREE.MeshStandardMaterial({
              metalness: 1.,
              roughness: 0.28
            })
  
            this.mat2.envMap = this.envMap;
  
            //rotating the texture by rotating the UVs around
            this.mat2.onBeforeCompile = (shader) => {
              shader.uniforms.uTime = { value: 0 };
  
              shader.fragmentShader = `
              uniform float uTime;
              mat4 rotationMatrix(vec3 axis, float angle) {
                axis = normalize(axis);
                float s = sin(angle);
                float c = cos(angle);
                float oc = 1.0 - c;
                
                return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                            oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                            oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                            0.0,                                0.0,                                0.0,                                1.0);
            }
            
            vec3 rotate(vec3 v, vec3 axis, float angle) {
              mat4 m = rotationMatrix(axis, angle);
              return (m * vec4(v, 1.0)).xyz;
            }
              ` + shader.fragmentShader;
      //envmap_physical_pars_fragment: envmap_physical_pars_fragment`
              shader.fragmentShader = shader.fragmentShader.replace(
                `import envmap_physical_pars_fragment from './ShaderChunk/envmap_physical_pars_fragment.glsl.js'`,
                `#ifdef USE_ENVMAP
  
                vec3 getIBLIrradiance( const in vec3 normal ) {
              
                  #ifdef ENVMAP_TYPE_CUBE_UV
              
                    vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
              
                    vec4 envMapColor = textureCubeUV( envMap, worldNormal, 1.0 );
              
                    return PI * envMapColor.rgb * envMapIntensity;
              
                  #else
              
                    return vec3( 0.0 );
              
                  #endif
              
                }
              
                vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
              
                  #ifdef ENVMAP_TYPE_CUBE_UV
              
                    vec3 reflectVec = reflect( - viewDir, normal );
              
                    // Mixing the reflection with the normal is more accurate and keeps rough objects from gathering light from behind their tangent plane.
                    reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
              
                    reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
  
                    reflectVec *= rotate( reflectVec, vec3( 0.0, 1.0, 0.0 ), uTime * .1);
              
                    vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );
              
                    return envMapColor.rgb * envMapIntensity;
              
                  #else
              
                    return vec3( 0.0 );
              
                  #endif
              
                }
              
                #ifdef USE_ANISOTROPY
              
                  vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
              
                    #ifdef ENVMAP_TYPE_CUBE_UV
              
                      // https://google.github.io/filament/Filament.md.html#lighting/imagebasedlights/anisotropy
                      vec3 bentNormal = cross( bitangent, viewDir );
                      bentNormal = normalize( cross( bentNormal, bitangent ) );
                      bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
              
                      return getIBLRadiance( viewDir, bentNormal, roughness );
              
                    #else
              
                      return vec3( 0.0 );
              
                    #endif
              
                  }
              
                #endif
              
              #endif`
              )
              this.mat2.userData.shader = shader;
            }
            this.blob2.material = this.mat2;
            this.human.add(this.blob2);
            
            this.blob2.rotation.set(0., 0.7, 0);
            // this.scene.add(gltf.scene);
            this.blob2.addEventListener('click', () => {
              console.log('blob2 clicked');
              this.rotateModel(blob2);
            });
          });
          
          // ======= Loading blob3 ====== //
          this.assetLoader.load(this.blob3.href, (gltf) => {
            this.blob3 = gltf.scene.children[0];
            this.blob3.scale.set(0.5, 0.5, 0.5);
            this.blob3.geometry.center()
            this.blob3.rotation.set(10., 0., 0.);
            this.blob3.position.set(2.,-1.,-0.6); //back, down ,right
            this.mat3 = new THREE.MeshStandardMaterial({
              metalness: 1.,
              roughness: 0.28
            })
  
            this.mat3.envMap = this.envMap;
  
            //rotating the texture by rotating the UVs around
            this.mat3.onBeforeCompile = (shader) => {
              shader.uniforms.uTime = { value: 0 };
  
              shader.fragmentShader = `
              uniform float uTime;
              mat4 rotationMatrix(vec3 axis, float angle) {
                axis = normalize(axis);
                float s = sin(angle);
                float c = cos(angle);
                float oc = 1.0 - c;
                
                return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                            oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                            oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                            0.0,                                0.0,                                0.0,                                1.0);
            }
            
            vec3 rotate(vec3 v, vec3 axis, float angle) {
              mat4 m = rotationMatrix(axis, angle);
              return (m * vec4(v, 1.0)).xyz;
            }
              ` + shader.fragmentShader;
      //envmap_physical_pars_fragment: envmap_physical_pars_fragment`
              shader.fragmentShader = shader.fragmentShader.replace(
                `import envmap_physical_pars_fragment from './ShaderChunk/envmap_physical_pars_fragment.glsl.js'`,
                `#ifdef USE_ENVMAP
  
                vec3 getIBLIrradiance( const in vec3 normal ) {
              
                  #ifdef ENVMAP_TYPE_CUBE_UV
              
                    vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
              
                    vec4 envMapColor = textureCubeUV( envMap, worldNormal, 1.0 );
              
                    return PI * envMapColor.rgb * envMapIntensity;
              
                  #else
              
                    return vec3( 0.0 );
              
                  #endif
              
                }
              
                vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
              
                  #ifdef ENVMAP_TYPE_CUBE_UV
              
                    vec3 reflectVec = reflect( - viewDir, normal );
              
                    // Mixing the reflection with the normal is more accurate and keeps rough objects from gathering light from behind their tangent plane.
                    reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
              
                    reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
  
                    reflectVec *= rotate( reflectVec, vec3( 0.0, 1.0, 0.0 ), uTime * .1);
              
                    vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );
              
                    return envMapColor.rgb * envMapIntensity;
              
                  #else
              
                    return vec3( 0.0 );
              
                  #endif
              
                }
              
                #ifdef USE_ANISOTROPY
              
                  vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
              
                    #ifdef ENVMAP_TYPE_CUBE_UV
              
                      // https://google.github.io/filament/Filament.md.html#lighting/imagebasedlights/anisotropy
                      vec3 bentNormal = cross( bitangent, viewDir );
                      bentNormal = normalize( cross( bentNormal, bitangent ) );
                      bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
              
                      return getIBLRadiance( viewDir, bentNormal, roughness );
              
                    #else
              
                      return vec3( 0.0 );
              
                    #endif
              
                  }
              
                #endif
              
              #endif`
              )
              this.mat2.userData.shader = shader;
            }
            this.blob3.material = this.mat3;
            this.human.add(this.blob3);
            this.blob3.rotateZ(-Math.PI/2);
            // this.scene.add(gltf.scene);
          });
  
        });
        
  
        //end of envMap function
      });
  }

  addLights() {
    const light1 = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xffffff, 0.5);
    light2.position.set(0.5, 0, 0.866);
    this.scene.add(light2);
  }

  setUpRaycaster() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  onMouseClick(event) {
    // console.log('mouse click');
    // Calculate mouse position
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    console.log('Mouse clicked at:', this.mouse.x, this.mouse.y); 

    // Update the picking ray with the camera and mouse position
    this.raycaster.setFromCamera(this.mouse, this.camera);


    // Calculate objects intersecting the picking ray
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    // Check if the model was clicked
    for (const intersect of intersects) {
      if (intersect.object === this.blob1) {
        console.log('click blob3');
        this.rotateModel(); // Call the rotateModel method
        break; // No need to continue checking
      }
    }
  }

  playRotationAnimation() {
    // Define the rotation animation parameters
    const duration = 1; // Duration in seconds
    const targetRotation = this.blob1.rotation.y + Math.PI * 2; // 360 degrees in radians

    // Create a keyframe animation
    const keyframes = [
      { time: 0, value: this.blob1.rotation.y },
      { time: duration, value: targetRotation }
    ];

    // Define the animation
    const rotationAnimation = new THREE.AnimationClip('rotation', duration, [
      new THREE.NumberKeyframeTrack('.rotation[y]', keyframes)
    ]);

    // Apply the animation to the rotation action
    this.rotationAction.stop(); // Stop any ongoing animations
    this.rotationAction = this.mixer.clipAction(rotationAnimation);
    this.rotationAction.play();
  }

  rotateModel() {
    // Rotate the model by a certain angle on each click
    // const rotationSpeed = this.time * 1.5; // Adjust this value as needed
    // this.blob3.rotation.y += rotationSpeed; // Rotate around the y-axis
    // this.yourModel.rotation.x += rotationSpeed; // Rotate around the x-axis if needed
    // this.yourModel.rotation.z += rotationSpeed; // Rotate around the z-axis if needed
    const duration = 3000; // Animation duration in milliseconds
    const targetRotation = this.blob1.rotation.y + Math.PI * 2; // 360 degrees in radians
    const initialRotation = this.blob1.rotation.y;

    const startTime = performance.now();
    const animateRotation = (timestamp) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1); // Ensure progress doesn't exceed 1
      this.blob1.rotation.y = initialRotation + progress * (targetRotation - initialRotation);

      if (progress < 1) {
        requestAnimationFrame(animateRotation);
      }
    };

    requestAnimationFrame(animateRotation);
  }
  
  render(){
    this.time+= 0.01;
    

    //Rotation action
    // Update the AnimationMixer
    this.mixer.update(this.clock.getDelta());

    this.smallSphere.visible = false;
    this.cubeCamera.update(this.renderer, this.scene);
    this.mat.uniforms.tCube.value = this.cubeRenderTarget.texture;

    this.smallSphere.visible = true;
    // this.smallSphere.rotation.x = this.time / 2;
    this.material.uniforms.time.value = this.time;
    this.renderer.render(this.scene, this.camera);
    // this.composer.render(this.scene, this.camera);

    if (this.human) {

      // if(this.m.userData){
      //   // console.log(this.m.userData)
      //   this.human.material.userData.shader.uniforms.uTime.value = this.time;
      // }
      this.human.rotation.z = this.time * 0.1;

      // this.human.rotateZ(0.001);
      this.human.geometry.visible = false;
    }
    
    if (this.blob3) {
      // this.blob3.rotation.z = this.time * 0.1;
      // this.blob3.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), this.time * 0.002);
    }
    

    // window.requestAnimationFrame(this.render.bind(this));
    requestAnimationFrame(this.render.bind(this));
  }

}

new Sketch({
  dom: document.getElementById("container")
});