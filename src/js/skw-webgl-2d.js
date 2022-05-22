let mouse = new THREE.Vector2(0, 0);

class Stage {
  constructor(isFullScreenCanvas) {
    this.cameraParam = {
      left: -1,
      right: 1,
      top: 1,
      bottom: -1,
      near: 0,
      far: -1
    };

    this.canvas = null;
    this.canvas_width = null;
    this.canvas_height = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.geometry = null;
    this.material = null;
    this.mesh = null;

    this.isInitialized = false;
    this.isFullScreenCanvas = isFullScreenCanvas;

    this.resolution = null;
    this.mouse = null;
  }



  init(canvas_id) {
    this._setScene();
    this._setRender(canvas_id);
    this._setCamera();
    this.canvas.addEventListener('mousemove', this.mouseMove, true);

    this.isInitialized = true;
  }

  _setScene() {
    this.scene = new THREE.Scene();
  }

  _setRender(canvas_id) {
    this.canvas = document.getElementById(canvas_id);
    this.canvas_width = this.canvas.width;
    this.canvas_height = this.canvas.height;
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas
    });

    if (this.isFullScreenCanvas) {
      this.renderParam = {
        width: window.innerWidth,
        height: window.innerHeight
      };
    } else {
      this.renderParam = {
        width: this.canvas_width,
        height: this.canvas_height
      };
    }

    this.renderer.setSize(this.renderParam.width, this.renderParam.height);
  }

  _setCamera() {

    if (!this.isInitialized) {
      this.camera = new THREE.OrthographicCamera(
        this.cameraParam.left,
        this.cameraParam.right,
        this.cameraParam.top,
        this.cameraParam.bottom,
        this.cameraParam.near,
        this.cameraParam.far
      );
    }

    let windowWidth = this.canvas_width;
    let windowHeight = this.canvas_height;

    if (this.isFullScreenCanvas) {
      windowWidth = window.innerWidth;
      windowHeight = window.innerHeight;
    }

    this.renderer.setSize(windowWidth, windowHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.camera.aspect = windowWidth / windowHeight;

    this.camera.updateProjectionMatrix();

    this.resolution = new THREE.Vector2(windowWidth, windowHeight);
  }

  _render() {
    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    this._setCamera();
  }

  onRaf() {
    this._render();
  }

  getResolution() {
    return this.resolution;
  }

  mouseMove(e) {
    mouse = new THREE.Vector2(e.offsetX / window.innerWidth, e.offsetY / window.innerHeight);
  }
}

class Mesh {
  constructor(stage) {
    this.geometryParm = {};

    this.materialParam = {
      useWireframe: false
    };

    this.uniforms = {
      time: { type: "f", value: 1.0 },
      mouse: { type: "v2", value: new THREE.Vector2(0, 0) },
      resolution: { type: "v2", value: new THREE.Vector2(0, 1) }
    };

    this.stage = stage;

    this.mesh = null;

    this.windowWidth = 0;
    this.windowHeight = 0;

    this.windowWidthHalf = 0;
    this.windowHeightHalf = 0;
    this.startTime = new Date().getTime();
  }

  init(vertex_name, fragment_name) {
    this._setMesh(vertex_name, fragment_name);
  }

  _setMesh(vertex_name, fragment_name) {
    //シェーダーの読み込み
    let vert = null;
    let frag = null;
    let parentClass = this;

    this._loadShader(vertex_name)
      .done(function (data) {
        console.log("シェーダーの取得成功：" + vertex_name);
        vert = data;
      }).then(
        this._loadShader(fragment_name)
          .done(function (data) {
            console.log("シェーダーの取得成功：" + fragment_name);
            frag = data;

            const geometry = new THREE.PlaneBufferGeometry(2, 2);
            const material = new THREE.RawShaderMaterial({
              vertexShader: vert,
              fragmentShader: frag,
              uniforms: parentClass.uniforms
            });

            parentClass.mesh = new THREE.Mesh(geometry, material);

            parentClass.stage.scene.add(parentClass.mesh);
          })
      ).fail(function () {
        console.log("シェーダーの取得に失敗しました：" + vertex_name);
      });
  }

  _render() {
    this.uniforms.time.value = (new Date().getTime() - this.startTime) * 0.001;
  }

  onRaf() {
    this._render();
  }

  _loadShader(shader_name) {
    return $.ajax({
      url: shader_name,
      type: 'GET',
      dataType: 'text'
    })
  }
}

function Threejs2DInit(canvas_id, vertex_name, fragment_name, isFullScreenCanvas = false) {
  const stage = new Stage(isFullScreenCanvas);
  stage.init(canvas_id);
  const mesh = new Mesh(stage);
  mesh.init(vertex_name, fragment_name);

  window.addEventListener("resize", () => {
    stage.onResize();
    mesh.uniforms.resolution = stage.getResolution();
  });

  const _raf = () => {
    window.requestAnimationFrame(() => {
      stage.onRaf();
      mesh.onRaf();
      mesh.uniforms.mouse.value = mouse;
      _raf();
    });
  };

  _raf();
}