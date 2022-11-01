function getElement(id) {
  return document.getElementById(id);
}

window.onload = () => {
  const previewImg = getElement('preview');
  const options = {
    width: 160,
    height: 144,
    drawMode: 'fill',
    backgroundColor: 'white',
    downloadName: '',
    previewImg
  };

  setupResolutionButtons(options);

  setupOption(options, 'drawMode');

  setupOption(options, 'backgroundColor');
  
  prepareImageUpload(options);

  getElement('convert').addEventListener('click', () => {
    convert(options);
  });

  getElement('download').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = options.downloadName + '.png';
    link.href = document.getElementById('output').toDataURL()
    link.click();
  });
}

function prepareImageUpload(options) {
  const changeFilename = (e) => {
    options.downloadName = e.target.value;
  };
  getElement('downloadName').addEventListener('change', changeFilename);
  getElement('downloadName').addEventListener('keyup', changeFilename);
  getElement('imageLoader').addEventListener('change', (e) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      options.downloadName = getElement('imageLoader').files[0].name + '_gray';
      getElement('downloadName').value = options.downloadName;
      options.previewImg.src = event.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
  });

  getElement('upload').addEventListener('click', () => {
    getElement('imageLoader').click();
  });
}

function convert(options) {
  const canvas = getElement('output');
  canvas.width = options.width;
  canvas.height = options.height;
  const ctx = canvas.getContext('2d');

  if (options.drawMode === 'cover') {
    drawCoverImage(ctx, options);
  }
  if (options.drawMode === 'fill') {
    clearCanvas(ctx, options);
    ctx.drawImage(options.previewImg, 0, 0, canvas.width, canvas.height);
  }
  if (options.drawMode === 'contain') {
    drawContainImage(ctx, options);
  }

  let imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  let pixels = imgData.data;
  for (var i = 0; i < pixels.length; i += 4) {
    let lightness = parseInt((
      0.2126 * pixels[i + 0] +
      0.7152 * pixels[i + 1] +
      0.0722 * pixels[i + 2]
    ));
    pixels[i] = lightness;
    pixels[i + 1] = lightness;
    pixels[i + 2] = lightness;
  }
  ctx.putImageData(imgData, 0, 0);
}

function setupOption(options, name) {
  const drawModes = getElement(name).children;
  for (mode of drawModes) {
    if (mode.className == 'selected') {
      options[name] = mode.getAttribute('value');
    }
    mode.addEventListener('click', (e) => {
      for (d of drawModes) {
        d.className = '';
      }
      e.target.className = 'selected';
      options[name] = e.target.getAttribute('value');
      console.log(options)
    });
  }
}

function setupResolutionButtons(convertResolution) {
  const setResolution = (target) => {
    const newRes = target.getAttribute('value').split(',');
    convertResolution.width = newRes[0];
    convertResolution.height = newRes[1];
    console.log(convertResolution);
  };

  const resolutions = getElement('resolution').children;
  for (resolution of resolutions) {
    if (resolution.className == 'selected') {
      setResolution(resolution);
    }
    resolution.addEventListener('click', (e) => {
      for (r of resolutions) {
        r.className = '';
      }
      e.target.className = 'selected';
      setResolution(e.target);
    });
  }
}

// this works well with landscape target canvases
// it should require some adjustment for portrait target canvases
function drawCoverImage(ctx, options) {
  const imgAspect = (options.previewImg.width / options.previewImg.height);
  let offsetW = 0;
  let offsetH = 0;
  let targetWidth = ctx.canvas.width;
  let targetHeight = ctx.canvas.height;
  const targetAspect = (targetWidth / targetHeight);
  console.log(targetWidth, targetHeight, imgAspect, targetAspect);

  // landscape sources
  if (imgAspect > 1 && imgAspect > targetAspect) {
    const canvasRatio = (targetHeight / options.previewImg.height);
    const scaledWidth = options.previewImg.width * canvasRatio;
    offsetW = (scaledWidth - targetWidth) / -2;
    console.log(canvasRatio, scaledWidth, offsetW);

    targetWidth = targetHeight * imgAspect;
  }
  // portrait sources
  else {
    const canvasRatio = (targetWidth / options.previewImg.width);
    const scaledHeight = options.previewImg.height * canvasRatio;
    offsetH = (scaledHeight - targetHeight) / -2;

    targetHeight = targetWidth / imgAspect;
  }

  clearCanvas(ctx, options);
  ctx.drawImage(options.previewImg, offsetW, offsetH, targetWidth, targetHeight);
}

function drawContainImage(ctx, options) {
  const targetWidth = ctx.canvas.width;
  const targetHeight = ctx.canvas.height;
  const hRatio = targetWidth / options.previewImg.width;
  const vRatio = targetHeight / options.previewImg.height;

  const ratio = Math.min(hRatio, vRatio);
  const centerShift_x = (targetWidth - options.previewImg.width * ratio) / 2;
  const centerShift_y = (targetHeight - options.previewImg.height * ratio) / 2;

  clearCanvas(ctx, options);
  ctx.drawImage(options.previewImg,
    0, 0, options.previewImg.width, options.previewImg.height,
    centerShift_x, centerShift_y, options.previewImg.width * ratio, options.previewImg.height * ratio);
}

function clearCanvas(ctx, options) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = options.backgroundColor;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}