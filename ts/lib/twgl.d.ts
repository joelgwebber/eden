// http://twgljs.org/docs/module-twgl.html
// NOSUBMIT: This d.ts isn't quite done. It needs another pass.
declare interface WebGLVertexArrayObject {
}

declare interface WebGLTransformFeedback {
}

declare interface WebGLSampler {
}

declare namespace twgl {

  type Vec3 = number[] | Float32Array;
  type Mat4 = number[] | Float32Array;

  type Arrays = {[name: string]: ArraySpec};
  type ArraySpec = number[] | ArrayBuffer | FullArraySpec;

  type CubemapReadyCallback = (err: any, tex: WebGLTexture, imgs: HTMLImageElement[]) => void;
  type ThreeDReadyCallback = (err: any, tex: WebGLTexture, imgs: HTMLImageElement[]) => void;
  type ErrorCallback = (msg: string) => void;
  type TextureReadyCallback = (err: any, tex: WebGLTexture, img: HTMLImageElement) => void;
  type TexturesReadyCallback = (err: any, tex: WebGLTexture, options: {[name: string]: TextureOptions}) => void;

  type Setters = {[name: string]: (x: any) => void};
  type Attribs = {[attribute: string]: AttribInfo};
  type Textureish = number[] | ArrayBuffer | HTMLCanvasElement | HTMLImageElement | HTMLVideoElement | string | string[] | TextureFunc;
  type TextureFunc = (gl: WebGLRenderingContext, options: TextureOptions) => Textureish;
  type BufferOrAttribInfo = BufferInfo | Attribs;
  type BufferOrVertexArrayInfo = BufferInfo | {[key: string]: VertexArrayInfo};

  interface AttachmentOptions {
    attach?: number;
    format?: number;
    type?: number;
    target?: number;
    level?: number;
    attachment?: WebGLObject;
  }

  interface ProgramOptions {
    errorCallback?: () => void;
    attribLocations?: {[key: string]: number};
    transformFeedbackVaryings?: BufferInfo | {[key: string]: AttribInfo} | string[];
    transformFeedbackMode?: number;
  }

  interface AttribInfo {
    buffer: WebGLBuffer;
    numComponents?: number;
    size?: number;
    type?: number;
    normalized?: boolean;
    offset?: number;
    stride?: number;
  }

  interface Defaults {
    attribPrefix?: string;
    textureColor?: number[];
    crossOrigin?: string;
    enableVertexArrayObjects?: boolean;
  }

  interface VertexArrayInfo {
    numElements: number;
    elementType?: number;
    vertexArrayObject: WebGLVertexArrayObject;
  }

  interface BufferInfo {
    numElements: number;
    attribs: Attribs;
    indices?: WebGLBuffer;
  }

  interface DrawObject {
    active?: boolean;
    type?: number;
    programInfo: ProgramInfo;
    bufferInfo: BufferInfo;
    uniforms: {[name: string]: number | number[]}; // TODO: ArrayBuffer?
    offset?: number;
    count?: number;
  }

  interface FramebufferInfo {
    framebuffer: WebGLFramebuffer;
    attachments: WebGLObject[];
  }

  interface FullArraySpec {
    data: number[] | ArrayBuffer;
    numComponents?: number
    type?: Function;
    size?: number;
    normalize?: boolean;
    stride?: number;
    offset?: number;
    attrib?: string;
    name?: string;
    attribName?: string;
  }

  interface TransformFeedbackInfo {
    index: number;
    type: number;
    size: number;
  }

  interface ProgramInfo {
    program: WebGLProgram;
    uniformSetters: {[name: string]: (x: any) => void};
    attribSetters: {[name: string]: (x: any) => void};
    transformFeedbackInfo: {[name: string]: TransformFeedbackInfo};
    uniformBlockSpec: {[name: string]: UniformBlockInfo};
  }

  interface UniformBlockInfo {
    name: string;
    array: ArrayBuffer;
    asFloat: Float32Array;
    buffer: WebGLBuffer;
    offset?: number;
    uniforms: {[key: string]: ArrayBufferView};
  }

  interface TextureOptions {
    target?: number;
    width?: number;
    height?: number;
    depth?: number;
    min?: number;
    mag?: number;
    minMag?: number;
    internalFormat?: number;
    format?: number;
    type?: number;
    wrap?: number;
    wrapS?: number;
    wrapT?: number;
    wrapR?: number;
    minLod?: number;
    maxLod?: number;
    baseLevel?: number;
    maxLevel?: number;
    unpackAlignment?: number;
    premultiplyAlpha?: number;
    flipY?: number;
    colorspaceConversion?: number;
    color?: number[] | ArrayBuffer;
    auto?: boolean;
    cubeFaceOrder?: number[];
    src?: Textureish;
    crossOrigin?: string;
  }

  function bindFramebufferInfo(gl: WebGLRenderingContext, framebufferInfo?: FramebufferInfo, target?: number);
  function bindTransformFeedbackInfo(gl: WebGLRenderingContext, transformFeedbackInfo: ProgramInfo | {[key: string]: TransformFeedbackInfo}, bufferInfo?: BufferOrAttribInfo);
  function bindUniformBlock(gl: WebGLRenderingContext, programInfo: ProgramInfo | {[key: string]: UniformBlockInfo}, uniformBlockInfo?: BufferOrAttribInfo)
  function createBufferInfoFromArrays(gl: WebGLRenderingContext, arrays: Arrays): BufferInfo;
  function createFramebufferInfo(gl: WebGLRenderingContext, attachments?: AttachmentOptions[], width?: number, height?: number): FramebufferInfo;
  function createProgramInfo(gl: WebGLRenderingContext, shaderSources: string[], opt_attribs?: string[], opt_locations?: number[], opt_errorCallback?: ErrorCallback): ProgramInfo;
  function createTexture(gl: WebGLRenderingContext, options?: TextureOptions, callback?: TextureReadyCallback): WebGLTexture;
  function createTextures(gl: WebGLRenderingContext, options: {[name: string]: TextureOptions}, callback?: TexturesReadyCallback): {[name: string]: WebGLTexture};
  function createTransformFeedback(gl: WebGLRenderingContext, programInfo: ProgramInfo | {[key: string]: TransformFeedbackInfo}, bufferInfo?: BufferOrAttribInfo): WebGLTransformFeedback;
  function createTransformFeedbackInfo(gl: WebGLRenderingContext, program: WebGLProgram): {[key: string]: TransformFeedbackInfo};
  function createUniformBlockInfo(gl: WebGLRenderingContext, programInfo: ProgramInfo, blockName: string): UniformBlockInfo;
  function drawBufferInfo(gl: WebGLRenderingContext, bufferInfo: BufferInfo, type?: number, count?: number, offset?: number);
  function drawObjectList(objectsToDraw: DrawObject[]);
  function getContext(canvas: HTMLCanvasElement, opt_attribs?: WebGLContextAttributes): WebGLRenderingContext;
  function getWebGLContext(canvas: HTMLCanvasElement, opt_attribs?: WebGLContextAttributes): WebGLRenderingContext;
  function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement, a?: number): boolean;
  function resizeFramebufferInfo(gl: WebGLRenderingContext, framebufferInfo: FramebufferInfo, attachments?: AttachmentOptions[], width?: number, height?: number);
  function resizeTexture(gl: WebGLRenderingContext, tex: WebGLTexture, options: TextureOptions, width?: number, height?: number);
  function setAttribInfoBufferFromArray(gl: WebGLRenderingContext, attribInfo: AttribInfo, array: ArraySpec, offset?: number);
  function setBlockUniforms(uniformBlockInfo: UniformBlockInfo, values: {[key: string]: any});
  function setBuffersAndAttributes(gl: WebGLRenderingContext, setters: ProgramInfo | Setters, buffers: BufferOrVertexArrayInfo);
  function setDefaults(newDefaults: Defaults);
  function setTextureFromArray(gl: WebGLRenderingContext, tex: WebGLTexture, src: number[] | ArrayBuffer, options?: TextureOptions);
  function setUniformBlock(gl: WebGLRenderingContext, programInfo: ProgramInfo | {[name: string]: UniformBlockInfo}, uniformBlockInfo: UniformBlockInfo);
  function setUniforms(setters: ProgramInfo | Setters, values: {[name: string]: any});

  namespace attributes {
    function createAttribsFromArrays(gl: WebGLRenderingContext, arrays: Arrays): Attribs;
    function createBufferFromArray(gl: WebGLRenderingContext, array: ArraySpec, arrayName: string): WebGLBuffer;
    function createBufferFromTypedArray(gl: WebGLRenderingContext, typedArray: ArrayBuffer | ArrayBufferView | WebGLBuffer, type: number, drawType: number): WebGLBuffer;
    function createBufferInfoFromArrays(gl: WebGLRenderingContext, arrays: Arrays): BufferInfo;
    function createBuffersFromArrays(WebGLRenderingContext, arrays: Arrays): {[name: string]: WebGLBuffer};
    function setAttribInfoBufferFromArray(gl: WebGLRenderingContext, attribInfo: AttribInfo, array: ArraySpec, offset?: number);
    function setAttributePrefix(prefix: string);
  }

  namespace textures {
    function getBytesPerElementForInternalFormat(internalFormat: number, type: number): number;
    function getNumComponentsForFormat(format: number): number;
    function loadCubemapFromUrls(gl: WebGLRenderingContext, tex: WebGLTexture, options: TextureOptions, callback?: CubemapReadyCallback);
    function loadSlicesFromUrls(gl: WebGLRenderingContext, tex: WebGLTexture, options: TextureOptions, callback?: ThreeDReadyCallback);
    function loadTextureFromUrl(gl: WebGLRenderingContext, tex: WebGLTexture, options: TextureOptions, callback?: TextureReadyCallback): HTMLImageElement;
    function setDefaultTextureColor(color: number[]);
    function setEmptyTexture(gl: WebGLRenderingContext, tex: WebGLTexture, options: TextureOptions);
    function setSamplerParameters(gl: WebGLRenderingContext, sampler: WebGLSampler, options: TextureOptions);
    function setTextureFilteringForSize(gl: WebGLRenderingContext, tex: WebGLTexture, options?: TextureOptions, width?: number, height?: number);
    function setTextureFromElement(gl: WebGLRenderingContext, tex: WebGLTexture, element: HTMLElement, options?: TextureOptions);
    function setTextureParameters(gl: WebGLRenderingContext, tex: WebGLTexture, options: TextureOptions);
    function setTextureTo1PixelColor(gl: WebGLRenderingContext, tex: WebGLTexture, options?: TextureOptions);
  }

  namespace programs {
    function createAttributeSetters(program: WebGLProgram): {[key: string]: Function};
    function createProgram(shaders: WebGLShader[], opt_attribs?: string[], opt_locations?: number[], opt_errorCallback?: ErrorCallback): WebGLProgram;
    function createProgramFromScripts(gl: WebGLRenderingContext, shaderScriptIds: string[], opt_attribs?: string[], opt_locations?: number[], opt_errorCallback?: ErrorCallback): WebGLProgram;
    function createProgramFromSources(gl: WebGLRenderingContext, shaderSources: string[], opt_attribs?: string[], opt_locations?: number[], opt_errorCallback?: ErrorCallback): WebGLProgram;
    function createProgramInfo(gl: WebGLRenderingContext, shaderSources: string[], opt_attribs?: ProgramOptions | string[], opt_locations?: number[], opt_errorCallback?: ErrorCallback): ProgramInfo;
    function createProgramInfoFromProgram(gl: WebGLRenderingContext, program: WebGLProgram): ProgramInfo;
    function createUniformBlockInfoFromProgram(gl: WebGLRenderingContext, program: WebGLProgram, uniformBlockSpec: {[name: string]: UniformBlockInfo}, blockName: string): UniformBlockInfo;
    function createUniformBlockSpecFromProgram(gl: WebGLRenderingContext, program: WebGLProgram): {[name: string]: UniformBlockInfo};
    function createUniformSetters(program: WebGLProgram): {[name: string]: (x: number|number[]) => void};
    function setAttributes(setters: Setters, buffers: Attribs);
  }

  namespace typedArray {
    function getGLTypeForTypedArray(typedArray: ArrayBuffer | ArrayBufferView): number;
    function getGLTypeForTypedArrayType(typedArrayType: Function): number;
    function getTypedArrayTypeForGLType(type: number): Function;
  }

  namespace vertexArrays {
    function createVAOAndSetAttributes(gl: WebGLRenderingContext, setters: Setters, attribs: Attribs, indices?: WebGLBuffer);
    function createVAOFromBufferInfo(gl: WebGLRenderingContext, programInfo: ProgramInfo | {[key: string]: Function}, bufferInfo: BufferInfo, indices?: WebGLBuffer);
    function createVertexArrayInfo(gl: WebGLRenderingContext, programInfo: ProgramInfo | {[key: string]: Function}, bufferInfo: BufferInfo): VertexArrayInfo;
  }

  namespace v3 {
    function add(a: Vec3, b: Vec3, dst?: Vec3): Vec3;
    function copy(v: Vec3, dst?: Vec3): Vec3;
    function create(): Vec3;
    function cross(a: Vec3, b: Vec3, dst?: Vec3): Vec3;
    function divide(a: Vec3, b: Vec3, dst?: Vec3): Vec3;
    function divScalar(v: Vec3, k: number, dst?: Vec3): Vec3;
    function dot(a: Vec3, b: Vec3): number;
    function length(v: Vec3): number;
    function lengthSq(v: Vec3): number;
    function lerp(a: Vec3, b: Vec3, t: number, dst?: Vec3);
    function mulScalar(v: Vec3, k: number, dst?: Vec3): Vec3;
    function multiply(a: Vec3, b: Vec3, dst?: Vec3): Vec3;
    function negate(v: Vec3, dst?: Vec3): Vec3;
    function normalize(a: Vec3, dst?: Vec3): Vec3;
    function subtract(a: Vec3, b: Vec3, dst?: Vec3): Vec3;
  }

  namespace m4 {
    function axisRotate(m: Mat4, axis: number, angleInRadians: number, dst?: Mat4): Mat4;
    function axisRotation(axis: Vec3, angleInRadians: number, dst?: Mat4): Mat4;
    function copy(m: Mat4, dst?: Mat4): Mat4;
    function frustum(left: number, right: number, bottom: number, top: number, near: number, far: number, dst?: Mat4): Mat4;
    function getAxis(m: Mat4, axis: Vec3): Vec3;
    function getTranslation(m: Mat4): Vec3;
    function identity(dst?: Mat4): Mat4;
    function inverse(m: Mat4, dst?: Mat4): Mat4;
    function lookAt(eye: Vec3, target: Vec3, up: Vec3, dst?: Mat4): Mat4;
    function multiply(a: Mat4, b: Mat4, dst?: Mat4): Mat4;
    function negate(m: Mat4, dst?: Mat4): Mat4;
    function ortho(left: number, right: number, top: number, bottom: number, near: number, far: number, dst?: Mat4): Mat4;
    function perspective(fieldOfViewYInRadians: number, aspect: number, zNear: number, zFar: number, dst?: Mat4): Mat4;
    function rotateX(m: Mat4, angleInRadians: number, dst?: Mat4): Mat4;
    function rotateY(m: Mat4, angleInRadians: number, dst?: Mat4): Mat4;
    function rotateZ(m: Mat4, angleInRadians: number, dst?: Mat4): Mat4;
    function rotationX(angleInRadians: number, dst?: Mat4): Mat4;
    function rotationY(angleInRadians: number, dst?: Mat4): Mat4;
    function rotationZ(angleInRadians: number, dst?: Mat4): Mat4;
    function scale(m: Mat4, v: Vec3, dst?: Mat4): Mat4;
    function scaling(v: Vec3, dst?: Mat4): Mat4;
    function setTranslation(a, v: Vec3, dst?: Mat4): Mat4;
    function transformDirection(m: Mat4, v: Vec3, dst?: Vec3): Vec3;
    function transformNormal(m: Mat4, v: Vec3, dst?: Vec3): Vec3;
    function transformPoint(m: Mat4, v: Vec3, dst?: Vec3): Vec3;
    function translate(m: Mat4, v: Vec3, dst?: Mat4): Mat4;
    function translation(v: Vec3, dst?: Mat4): Mat4;
    function transpose(m: Mat4, dst?: Mat4): Mat4;
  }

  // TODO(jgw): Most params lack types.
  namespace primitives {
    function concatVertices(arrays: Arrays): Arrays;
    function create3DFBufferInfo(gl): BufferInfo
    function create3DFBuffers(gl): { [name: string]: WebGLBuffer};
    function create3DFVertices(): { [name: string]: ArrayBuffer};
    function createAugmentedTypedArray(numComponents: number, numElements: number, opt_type?: Function): ArrayBuffer;
    function createCresentBufferInfo(gl, verticalRadius, outerRadius, innerRadius, thickness, subdivisionsDown, subdivisionsThick, startOffset, endOffset): BufferInfo
    function createCresentBuffers(gl, verticalRadius, outerRadius, innerRadius, thickness, subdivisionsDown, subdivisionsThick, startOffset, endOffset): { [name: string]: WebGLBuffer};
    function createCresentVertices(verticalRadius, outerRadius, innerRadius, thickness, subdivisionsDown, subdivisionsThick, startOffset, endOffset): { [name: string]: ArrayBuffer};
    function createCubeBufferInfo(gl, size): BufferInfo
    function createCubeBuffers(gl, size): { [name: string]: WebGLBuffer};
    function createCubeVertices(size): { [name: string]: ArrayBuffer};
    function createCylinderBufferInfo(gl, radius, height, radialSubdivisions, verticalSubdivisions, topCap, bottomCap): BufferInfo
    function createCylinderBuffers(gl, radius, height, radialSubdivisions, verticalSubdivisions, topCap, bottomCap): { [name: string]: WebGLBuffer};
    function createCylinderVertices(radius, height, radialSubdivisions, verticalSubdivisions, topCap, bottomCap): { [name: string]: ArrayBuffer};
    function createDiscBufferInfo(gl, radius, divisions, stacks, innerRadius, stackPower): BufferInfo
    function createDiscBuffers(gl, radius, divisions, stacks, innerRadius, stackPower): { [name: string]: WebGLBuffer};
    function createDiscVertices(radius, divisions, stacks, innerRadius, stackPower): { [name: string]: ArrayBuffer};
    function createPlaneBufferInfo(gl, width, depth, subdivisionsWidth, subdivisionsDepth, matrix): BufferInfo;
    function createPlaneBuffers(gl, width, depth, subdivisionsWidth, subdivisionsDepth, matrix): { [name: string]: WebGLBuffer};
    function createPlaneVertices(width, depth, subdivisionsWidth, subdivisionsDepth, matrix): { [name: string]: ArrayBuffer};
    function createSphereBufferInfo(gl, radius, subdivisionsAxis, subdivisionsHeight, opt_startLatitudeInRadians, opt_endLatitudeInRadians, opt_startLongitudeInRadians, opt_endLongitudeInRadians): BufferInfo
    function createSphereBuffers(gl, radius, subdivisionsAxis, subdivisionsHeight, opt_startLatitudeInRadians, opt_endLatitudeInRadians, opt_startLongitudeInRadians, opt_endLongitudeInRadians): { [name: string]: WebGLBuffer};
    function createSphereVertices(radius, subdivisionsAxis, subdivisionsHeight, opt_startLatitudeInRadians, opt_endLatitudeInRadians, opt_startLongitudeInRadians, opt_endLongitudeInRadians): {[name: string]: ArrayBuffer};
    function createTorusBufferInfo(gl, radius, thickness, radialSubdivisions, bodySubdivisions, startAngle, endAngle): BufferInfo
    function createTorusBuffers(gl, radius, thickness, radialSubdivisions, bodySubdivisions, startAngle, endAngle): {[name: string]: WebGLBuffer};
    function createTorusVertices(radius, thickness, radialSubdivisions, bodySubdivisions, startAngle, endAngle): {[name: string]: ArrayBuffer};
    function createTruncatedConeBufferInfo(gl, bottomRadius, topRadius, height, radialSubdivisions, verticalSubdivisions, opt_topCap, opt_bottomCap): BufferInfo
    function createTruncatedConeBuffers(gl, bottomRadius, topRadius, height, radialSubdivisions, verticalSubdivisions, opt_topCap, opt_bottomCap): {[name: string]: WebGLBuffer};
    function createTruncatedConeVertices(bottomRadius, topRadius, height, radialSubdivisions, verticalSubdivisions, opt_topCap, opt_bottomCap): {[name: string]: ArrayBuffer};
    function createXYQuadBufferInfo(gl, size, xOffset, yOffset): {[name: string]: WebGLBuffer};
    function createXYQuadBuffers(gl, size, xOffset, yOffset): BufferInfo
    function createXYQuadVertices(size, xOffset, yOffset)
    function deindexVertices(vertices): {[name: string]: ArrayBuffer};
    function duplicateVertices(arrays): Arrays;
    function flattenNormals(vertices): {[name: string]: ArrayBuffer};
    function makeRandomVertexColors(vertices, options): {[name: string]: ArrayBuffer};
    function reorientDirections(array, matrix): number[] | ArrayBuffer;
    function reorientNormals(array, matrix): number[] | ArrayBuffer;
    function reorientPositions(array, matrix): number[] | ArrayBuffer;
    function reorientVertices(arrays, matrix): { [name: string]: (number[] | ArrayBuffer) };

    type RandomColorFunc = (ndx, channel) => number;

    interface RandomVerticesOptions {
      vertsPerColor?: number;
      rand?: RandomColorFunc;
    }
  }
}
