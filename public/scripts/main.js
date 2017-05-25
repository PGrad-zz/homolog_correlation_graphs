define(function (require) {
    let cytoscape = require('cytoscape');
    let math = require('math');
    let type_map = ["Antihomolog", "Homolog"];
    let CENTER_NAME = "center";
    let CENTER_LABEL;
    function mapNodeLabel(ele) {
        id = ele.data("id");
        return id == CENTER_NAME ? CENTER_LABEL :
               id;
    }
    function mapNodeSize(ele) {
        id = ele.data("id");
        return id == CENTER_NAME ? 2000  :
               id.includes("-") ? 200 : 
               id.includes(":") ? 100 :
                                  500;
    }
    function mapFontSize(ele) {
        id = ele.data("id");
        return id == CENTER_NAME ? 700 :
               id.includes("-") ? 50 : 
               id.includes(":") ? 35 :
                                  200;
    }
    function loadJson(json_file) {
        return new Promise((resolve, reject) => {
            let xobj = new XMLHttpRequest();
            xobj.overrideMimeType("application/json");
            xobj.open('GET', json_file, true);
            xobj.onreadystatechange = function() {
                if (xobj.readyState == 4 && xobj.status == "200") {

                    // .open will NOT return a value but simply returns undefined in async mode so use a callback
                    resolve(xobj.responseText);

                }
            };
            xobj.send(null);
        });
    }
    function setDimensions() {
        console.log(window.innerHeight + " " + window.innerWidth);
        document.getElementById('cy').style.height = window.innerHeight.toString() + "px";
        document.getElementById('cy').style.width = window.innerWidth.toString() + "px";
        cy.center();
    }
    function make_homolog_star(cy, center, periphs) {
        let angle = math.chain(360).divide(periphs.length);
        let shift = angle;
        let radian = 0;
        let nodes = [];
        let node = {};
        for(i = 0; i < periphs.length; ++i) {
            node = { group: "nodes", data: {id: periphs[i].name} };
            radian = math.chain(angle).multiply(math.pi).divide(180).value;
            node.position = { "x": math.chain(radian).cos().multiply(periphs[i].dist).add(center.position.x).value,
                              "y": math.chain(radian).sin().multiply(periphs[i].dist).add(center.position.y).value };
            nodes.push(node);
            angle += shift;
        }
        return nodes;
    }
    function connect_stars(cy, center, periphs, vals) {
        let edges = [];
        for(i = 0; i < periphs.length; ++i)
            edges.push({ group: "edges", data: { id: periphs[i].data.id + "_edge", source: center.data.id, target: periphs[i].data.id, label: vals[i] } });
        cy.add(edges);
    }
    function init(node_val, proportion_val, center) {
        let node_json = JSON.parse(node_val);
        let proportion_json = JSON.parse(proportion_val);
        let L1 = [], L1_dist = 13440, species;
        let homologs, L2, L2_dist = 3500, L2_size = 100;
        let L3, species_dists, L3_dist = 420, L3_size = 10;
        for(let species_name in node_json)
            L1.push({ name: species_name, dist: L1_dist });
        L1 = make_homolog_star(cy, center, L1);
        cy.add(L1);
        for(let i = 0; i < L1.length; ++i) {
            species = L1[i].data.id;
            homologs = [];
            homolog_names = [];
            L2 = [];
            console.log(species);
            for(let homolog in node_json[species]) {
                homologs.push({ name: homolog + ":" + proportion_json[species][homolog], dist: L2_dist, size: L2_size });
                homolog_names.push(homolog);
            }
            L2 = make_homolog_star(cy, L1[i], homologs);
            cy.add(L2);
            for(let h = 0; h < L2.length; ++h) {
                L3 = [];
                vals = [];
                species_dists = node_json[species][homolog_names[h]];
                let s = 0;
                for(let species2 in species_dists) {
                    L3.push({name: species2 + i.toString() + ":" + h.toString() + ":" + s.toString(), dist: species_dists[species2] * L3_dist, size: L3_size});
                    vals.push(species_dists[species2]);
                }
                L3 = make_homolog_star(cy, L2[h], L3);
                cy.add(L3);
                connect_stars(cy, L2[h], L3, vals);
            }
        }
        setDimensions();
    }
    window.addEventListener("resize", setDimensions);
    let cy = cytoscape({

      container: document.getElementById('cy'),

      elements: [ // list of graph elements to start with
      ],

      style: [ // the stylesheet for the graph
        {
          selector: 'node',
          style: {
            'background-color': '#000',
            'label': mapNodeLabel,
            'font-size': mapFontSize,
            'width': mapNodeSize,
            'height': mapNodeSize
          }
        },

        {
          selector: 'edge',
          style: {
            'label': 'data(label)',
            'width': 40,
            'font-size': 30,
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
            'target-arrow-shape': 'triangle'
          }
        }
      ],

      layout: {
        name: 'grid',
        rows: 1
      },

      // initial viewport state:
      zoom: 0.025,
      pan: { x: 0, y: 0 },

      // interaction options:
      minZoom: 1e-50,
      maxZoom: 1e50,
      zoomingEnabled: true,
      userZoomingEnabled: true,
      panningEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
      selectionType: 'single',
      touchTapThreshold: 8,
      desktopTapThreshold: 4,
      autolock: false,
      autoungrabify: false,
      autounselectify: false,

      // rendering options:
      headless: false,
      styleEnabled: true,
      hideEdgesOnViewport: false,
      hideLabelsOnViewport: false,
      textureOnViewport: false,
      motionBlur: false,
      motionBlurOpacity: 0.2,
      wheelSensitivity: 1,
      pixelRatio: 'auto'
    });
    let homologPromise = loadJson('../resources/homolog_correlation.json');
    let antihomologPromise = loadJson('../resources/antihomolog_correlation.json');
    let proportionJson = loadJson('../resources/proportion.json');
    Promise.all([antihomologPromise, homologPromise, proportionJson]).then((values) => {
        let center = {position: {x: 0, y: 0}};
        type = 1;
        CENTER_LABEL = type_map[type] + ": Click to Change";
        cy.add({ group: "nodes", 
                 data: { id: CENTER_NAME },
                 position: { x: center.position.x, y: center.position.y }
               });
        cy.on("tap", "#" + CENTER_NAME, (evt) => {
            cy.remove("[id!='']");
            type = (type + 1) % 2;
            CENTER_LABEL = type_map[type] + ": Click to Change";
            cy.add({ group: "nodes", 
                     data: { id: CENTER_NAME },
                     position: { x: center.position.x, y: center.position.y }
                   });
            init(values[type], values[2], center);
        });
        init(values[type], values[2], center);
        
    });
});
