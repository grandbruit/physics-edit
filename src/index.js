import Paper from 'paper';
import earcut from 'earcut';

Paper.setup('physics-edit');

// This group will contain the image
const container = new Paper.Group;

const image = document.createElement('img');
image.src = '/images/placeholder.png';
image.onload = () => {
  // Load image and add it to container group
	const raster = new Paper.Raster(image);
  container.addChild(raster);
  raster.sendToBack();
  Paper.view.viewSize = [raster.width, raster.height];
  raster.position = [raster.width / 2, raster.height / 2];
};

let jsonString = '';

// Create polygon drawing tool
const tool = new Paper.Tool();

// Create polygon path
let polygonPath = new Paper.Path();

function setupPolygonPath(polygonPath) {
  container.addChild(polygonPath);
  polygonPath.bringToFront();
  polygonPath.strokeColor = null;
  polygonPath.fillColor = new Paper.Color(.2, .6, .9, 0.2);
  polygonPath.closed = 'true';
  polygonPath.selected = 'true';
}

setupPolygonPath(polygonPath);

// Handle mouse events
tool.onMouseDown = (event) => {
  if (!polygonPath.selectedSegment) {
    polygonPath.selectedSegment = polygonPath.add(event.point);
  }
  
  // Create a flat array of vertices suitable for use with earcut
  const polygonVertices = [];
  polygonPath.segments.forEach((segment) => {
    polygonVertices.push(Math.round(segment.point.x), Math.round(segment.point.y));
  });
  
  // Triangulate using delaunay-fast. This returns an unidimensional array of indices referencing
  // items from the input array, with no delimitation between triangles.
  const triangleIndicesRaw = earcut(polygonVertices);
  
  // Split the raw output from delaunay-fast so we have one array per triangle
  const triangleIndices = [];
  while (triangleIndicesRaw.length > 0) {
    triangleIndices.push(triangleIndicesRaw.splice(0, 3));
  }
  
  // Substitute indices for actual coordinates, and format the array the way P2 wants it
  const triangles = [];
  triangleIndices.forEach((pointIndices) => {
    triangles.push([].concat.apply([], pointIndices.map((pointIndex) => {
      return [polygonVertices[pointIndex * 2], polygonVertices[pointIndex * 2 + 1]];
    })));
  });
  
  // Update JSON
  const shapeName = document.getElementById('name').value;
  const json = { [shapeName] :
    triangles.map((triangle) => {
      return { "shape" : triangle };
    })
  };
  
  jsonString = JSON.stringify(json);
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

// Interface
document.getElementById('import-template').addEventListener('change', (e) => {
  const input = e.target;

  if (input.files && input.files[0]) {
    var reader = new FileReader();

    reader.onload = (e) => {
      // Use uploaded image as template
      image.src = e.target.result;
      
      // Automatically fill in shape name based on filename
      const filename = input.value.split("/").pop().split("\\").pop().split(".").slice(0, -1)[0];
      document.getElementById('name').value = filename;
    }

    reader.readAsDataURL(input.files[0]);
  }
})
document.getElementById('import-svg').addEventListener('change', (e) => {
  const input = e.target;
  
  if (input.files && input.files[0]) {
    var reader = new FileReader();

    reader.onload = (e) => {
      polygonPath.remove();

      // Import SVG
      Paper.project.importSVG(e.target.result, (item) => {
        for (let i = 0; i < item.children.length; i++) {
          const reducedItem = item.children[i].reduce();
          if (reducedItem.className == 'Path') {
            polygonPath = reducedItem;
            break;
          }
          if (reducedItem.className == 'Group') {
            for (let j = 0; j < reducedItem.children.length; j++) {
              if (reducedItem.children[j].className == 'Path') {
                polygonPath = reducedItem.children[j];
                break;
              }
            }
          }
        }
        item.remove();

        setupPolygonPath(polygonPath)
      })
    }

    reader.readAsDataURL(input.files[0]);
  }
})
document.getElementById('export-svg').addEventListener('click', () => {
  const element = document.createElement('a');
  const exportOptions = { 
    asString: true, 
    matchShapes: true, 
    embedImages: false 
  };
  const svgString = Paper.project.exportSVG(exportOptions);
  const filename = document.getElementById('name').value + '.svg';
  
  element.setAttribute('href', 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
})
document.getElementById('export-json').addEventListener('click', () => {
  const element = document.createElement('a');
  const filename = document.getElementById('name').value + '.json';
  
  element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonString));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
})
