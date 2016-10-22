import Paper from 'paper';

Paper.setup('physics-edit');

// This group will contain the image
const container = new Paper.Group;

const image = document.createElement('img');
image.src = '/images/date.png';
image.onload = () => {
  // Load image and add it to container group
	const raster = new Paper.Raster(image);
  container.addChild(raster);
  Paper.view.viewSize = [raster.width, raster.height];
  raster.position = [raster.width / 2, raster.height / 2];
  
  // Scale down container group if the image is too big for the viewport
  // const scaleRatio = Math.min(1, Paper.view.size.width / raster.width, Paper.view.size.height / raster.height);
  // container.scale(scaleRatio);
};

// Create polygon drawing tool
const tool = new Paper.Tool();

// Create polygon path
const polygonPath = new Paper.Path();
container.addChild(polygonPath);
polygonPath.fillColor = new Paper.Color(.2, .6, .9, 0.2);
polygonPath.closed = 'true';
polygonPath.selected = 'true';

// Handle mouse events
tool.onMouseDown = (event) => {
  if (!polygonPath.selectedSegment) {
    polygonPath.selectedSegment = polygonPath.add(event.point);
  }
  
  // Update JSON
  const coordinates = [];
  polygonPath.segments.forEach((segment) => {
    coordinates.push(segment.point.x, segment.point.y);
  });
  const json = { "date" : [ { "shape" : coordinates } ] };
  console.log(JSON.stringify(json));
}

tool.onMouseDrag = (event) => {
  polygonPath.selectedSegment.point = event.point;
}

tool.onMouseMove = (event) => {
  polygonPath.selectedSegment = null;
  polygonPath.segments.forEach((segment) => {
    if (segment.point.isClose(event.point, 10)) {
      polygonPath.selectedSegment = segment;
      segment.selected = true;
    } else {
      segment.selected = false;
    }
  });
}