import Paper from 'paper';
import Delaunay from 'delaunay-fast';

let roger = Delaunay.triangulate([[0, 0], [10, 0], [10, 20], [0, 20]]);
// console.log(roger);

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
  
  // Create an array of vertices suitable for use with delaunay-fast, e.g. [[x, y], [x, y]...]
  const polygonVertices = [];
  polygonPath.segments.forEach((segment) => {
    polygonVertices.push([Math.round(segment.point.x), Math.round(segment.point.y)]);
  });
  
  // Triangulate using delaunay-fast. This returns an unidimensional array of indices referencing
  // items from the input array, with no delimitation between triangles.
  const triangleIndicesRaw = Delaunay.triangulate(polygonVertices);
  
  // Split the raw output from delaunay-fast so we have one array per triangle
  const triangleIndices = [];
  while (triangleIndicesRaw.length > 0) {
    triangleIndices.push(triangleIndicesRaw.splice(0, 3));
  }

  // Substitute indices for actual coordinates, and format the array the way P2 wants it
  const triangles = [];
  triangleIndices.forEach((pointIndices) => {
    triangles.push([].concat.apply([], pointIndices.map((pointIndex) => {
      return polygonVertices[pointIndex];
    })));
  });

  // Update JSON
  const json = { "date" :
    triangles.map((triangle) => {
      return { "shape" : triangle };
    })
  };
  
  // Output JSON to the console for now
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