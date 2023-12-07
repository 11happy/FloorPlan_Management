
/*
 * Camera Buttons
 */

var CameraButtons = function(blueprint3d) {

    var orbitControls = blueprint3d.three.controls;
    var three = blueprint3d.three;
  
    var panSpeed = 30;
    var directions = {
      UP: 1,
      DOWN: 2,
      LEFT: 3,
      RIGHT: 4
    }
  
    function init() {
      // Camera controls
      $("#zoom-in").click(zoomIn);
      $("#zoom-out").click(zoomOut);  
      $("#zoom-in").dblclick(preventDefault);
      $("#zoom-out").dblclick(preventDefault);
  
      $("#reset-view").click(three.centerCamera)
  
      $("#move-left").click(function(){
        pan(directions.LEFT)
      })
      $("#move-right").click(function(){
        pan(directions.RIGHT)
      })
      $("#move-up").click(function(){
        pan(directions.UP)
      })
      $("#move-down").click(function(){
        pan(directions.DOWN)
      })
  
      $("#move-left").dblclick(preventDefault);
      $("#move-right").dblclick(preventDefault);
      $("#move-up").dblclick(preventDefault);
      $("#move-down").dblclick(preventDefault);
    }
  
    function preventDefault(e) {
      e.preventDefault();
      e.stopPropagation();
    }
  
    function pan(direction) {
      switch (direction) {
        case directions.UP:
          orbitControls.panXY(0, panSpeed);
          break;
        case directions.DOWN:
          orbitControls.panXY(0, -panSpeed);
          break;
        case directions.LEFT:
          orbitControls.panXY(panSpeed, 0);
          break;
        case directions.RIGHT:
          orbitControls.panXY(-panSpeed, 0);
          break;
      }
    }
  
    function zoomIn(e) {
      e.preventDefault();
      orbitControls.dollyIn(1.1);
      orbitControls.update();
    }
  
    function zoomOut(e) {
      e.preventDefault;
      orbitControls.dollyOut(1.1);
      orbitControls.update();
    }
  
    init();
  }
  
  /*
   * Context menu for selected item
   */ 
  
  var ContextMenu = function(blueprint3d) {
  
    var scope = this;
    var selectedItem;
    var three = blueprint3d.three;
  
    function init() {
      $("#context-menu-delete").click(function(event) {
          selectedItem.remove();
      });
  
      three.itemSelectedCallbacks.add(itemSelected);
      three.itemUnselectedCallbacks.add(itemUnselected);
  
      initResize();
  
      $("#fixed").click(function() {
          var checked = $(this).prop('checked');
          selectedItem.setFixed(checked);
      });
    }
  
    function cmToIn(cm) {
      return cm / 2.54;
    }
  
    function inToCm(inches) {
      return inches * 2.54;
    }
  
    function itemSelected(item) {
      selectedItem = item;
  
      $("#context-menu-name").text(item.metadata.itemName);
  
      $("#item-width").val(cmToIn(selectedItem.getWidth()).toFixed(0));
      $("#item-height").val(cmToIn(selectedItem.getHeight()).toFixed(0));
      $("#item-depth").val(cmToIn(selectedItem.getDepth()).toFixed(0));
  
      $("#context-menu").show();
  
      $("#fixed").prop('checked', item.fixed);
    }
  
    function resize() {
      selectedItem.resize(
        inToCm($("#item-height").val()),
        inToCm($("#item-width").val()),
        inToCm($("#item-depth").val())
      );
    }
  
    function initResize() {
      $("#item-height").change(resize);
      $("#item-width").change(resize);
      $("#item-depth").change(resize);
    }
  
    function itemUnselected() {
      selectedItem = null;
      $("#context-menu").hide();
    }
  
    init();
  }
  
  /*
   * Loading modal for items
   */
  
  var ModalEffects = function(blueprint3d) {
  
    var scope = this;
    var blueprint3d = blueprint3d;
    var itemsLoading = 0;
  
    this.setActiveItem = function(active) {
      itemSelected = active;
      update();
    }
  
    function update() {
      if (itemsLoading > 0) {
        $("#loading-modal").show();
      } else {
        $("#loading-modal").hide();
      }
    }
  
    function init() {
      blueprint3d.model.scene.itemLoadingCallbacks.add(function() {
        itemsLoading += 1;
        update();
      });
  
       blueprint3d.model.scene.itemLoadedCallbacks.add(function() {
        itemsLoading -= 1;
        update();
      });   
  
      update();
    }
  
    init();
  }
  
  /*
   * Side menu
   */
  
  var SideMenu = function(blueprint3d, floorplanControls, modalEffects) {
    var blueprint3d = blueprint3d;
    var floorplanControls = floorplanControls;
    var modalEffects = modalEffects;
  
    var ACTIVE_CLASS = "active";
  
    var tabs = {
      "FLOORPLAN" : $("#floorplan_tab"),
      "SHOP" : $("#items_tab"),
      "DESIGN" : $("#design_tab")
    }
  
    var scope = this;
    this.stateChangeCallbacks = $.Callbacks();
  
    this.states = {
      "DEFAULT" : {
        "div" : $("#viewer"),
        "tab" : tabs.DESIGN
      },
      "FLOORPLAN" : {
        "div" : $("#floorplanner"),
        "tab" : tabs.FLOORPLAN
      },
      "SHOP" : {
        "div" : $("#add-items"),
        "tab" : tabs.SHOP
      }
    }
  
    // sidebar state
    var currentState = scope.states.FLOORPLAN;
  
    function init() {
      for (var tab in tabs) {
        var elem = tabs[tab];
        elem.click(tabClicked(elem));
      }
  
      $("#update-floorplan").click(floorplanUpdate);
  
      initLeftMenu();
  
      blueprint3d.three.updateWindowSize();
      handleWindowResize();
  
      initItems();
  
      setCurrentState(scope.states.DEFAULT);
    }
  
    function floorplanUpdate() {
      setCurrentState(scope.states.DEFAULT);
    }
  
    function tabClicked(tab) {
      return function() {
        // Stop three from spinning
        blueprint3d.three.stopSpin();
  
        // Selected a new tab
        for (var key in scope.states) {
          var state = scope.states[key];
          if (state.tab == tab) {
            setCurrentState(state);
            break;
          }
        }
      }
    }
    
    function setCurrentState(newState) {
  
      if (currentState == newState) {
        return;
      }
  
      // show the right tab as active
      if (currentState.tab !== newState.tab) {
        if (currentState.tab != null) {
          currentState.tab.removeClass(ACTIVE_CLASS);          
        }
        if (newState.tab != null) {
          newState.tab.addClass(ACTIVE_CLASS);
        }
      }
  
      // set item unselected
      blueprint3d.three.getController().setSelectedObject(null);
  
      // show and hide the right divs
      currentState.div.hide()
      newState.div.show()
  
      // custom actions
      if (newState == scope.states.FLOORPLAN) {
        floorplanControls.updateFloorplanView();
        floorplanControls.handleWindowResize();
      } 
  
      if (currentState == scope.states.FLOORPLAN) {
        blueprint3d.model.floorplan.update();
      }
  
      if (newState == scope.states.DEFAULT) {
        blueprint3d.three.updateWindowSize();
      }
   
      // set new state
      handleWindowResize();    
      currentState = newState;
  
      scope.stateChangeCallbacks.fire(newState);
    }
  
    function initLeftMenu() {
      $( window ).resize( handleWindowResize );
      handleWindowResize();
    }
  
    function handleWindowResize() {
      $(".sidebar").height(window.innerHeight);
      $("#add-items").height(window.innerHeight);
  
    };
  
    // TODO: this doesn't really belong here
    function initItems() {
      $("#add-items").find(".add-item").mousedown(function(e) {
        var modelUrl = $(this).attr("model-url");
        var itemType = parseInt($(this).attr("model-type"));
        var metadata = {
          itemName: $(this).attr("model-name"),
          resizable: true,
          modelUrl: modelUrl,
          itemType: itemType
        }
  
        blueprint3d.model.scene.addItem(itemType, modelUrl, metadata);
        setCurrentState(scope.states.DEFAULT);
      });
    }
  
    init();
  
  }
  
  /*
   * Change floor and wall textures
   */
  
  var TextureSelector = function (blueprint3d, sideMenu) {
  
    var scope = this;
    var three = blueprint3d.three;
    var isAdmin = isAdmin;
  
    var currentTarget = null;
  
    function initTextureSelectors() {
      $(".texture-select-thumbnail").click(function(e) {
        var textureUrl = $(this).attr("texture-url");
        var textureStretch = ($(this).attr("texture-stretch") == "true");
        var textureScale = parseInt($(this).attr("texture-scale"));
        currentTarget.setTexture(textureUrl, textureStretch, textureScale);
  
        e.preventDefault();
      });
    }
  
    function init() {
      three.wallClicked.add(wallClicked);
      three.floorClicked.add(floorClicked);
      three.itemSelectedCallbacks.add(reset);
      three.nothingClicked.add(reset);
      sideMenu.stateChangeCallbacks.add(reset);
      initTextureSelectors();
    }
  
    function wallClicked(halfEdge) {
      currentTarget = halfEdge;
      $("#floorTexturesDiv").hide();  
      $("#wallTextures").show();  
    }
  
    function floorClicked(room) {
      currentTarget = room;
      $("#wallTextures").hide();  
      $("#floorTexturesDiv").show();  
    }
  
    function reset() {
      $("#wallTextures").hide();  
      $("#floorTexturesDiv").hide();  
    }
  
    init();
  }
  
  /*
   * Floorplanner controls
   */
  
  var ViewerFloorplanner = function(blueprint3d) {
  
    var canvasWrapper = '#floorplanner';
  
    // buttons
    var move = '#move';
    var remove = '#delete';
    var draw = '#draw';
  
    var activeStlye = 'btn-primary disabled';
  
    this.floorplanner = blueprint3d.floorplanner;
  
    var scope = this;
  
    function init() {
  
      $( window ).resize( scope.handleWindowResize );
      scope.handleWindowResize();
  
      // mode buttons
      scope.floorplanner.modeResetCallbacks.add(function(mode) {
        $(draw).removeClass(activeStlye);
        $(remove).removeClass(activeStlye);
        $(move).removeClass(activeStlye);
        if (mode == BP3D.Floorplanner.floorplannerModes.MOVE) {
            $(move).addClass(activeStlye);
        } else if (mode == BP3D.Floorplanner.floorplannerModes.DRAW) {
            $(draw).addClass(activeStlye);
        } else if (mode == BP3D.Floorplanner.floorplannerModes.DELETE) {
            $(remove).addClass(activeStlye);
        }
  
        if (mode == BP3D.Floorplanner.floorplannerModes.DRAW) {
          $("#draw-walls-hint").show();
          scope.handleWindowResize();
        } else {
          $("#draw-walls-hint").hide();
        }
      });
  
      $(move).click(function(){
        scope.floorplanner.setMode(BP3D.Floorplanner.floorplannerModes.MOVE);
      });
  
      $(draw).click(function(){
        scope.floorplanner.setMode(BP3D.Floorplanner.floorplannerModes.DRAW);
      });
  
      $(remove).click(function(){
        scope.floorplanner.setMode(BP3D.Floorplanner.floorplannerModes.DELETE);
      });
    }
  
    this.updateFloorplanView = function() {
      scope.floorplanner.reset();
    }
  
    this.handleWindowResize = function() {
      $(canvasWrapper).height(window.innerHeight - $(canvasWrapper).offset().top);
      scope.floorplanner.resizeView();
    };
  
    init();
  }; 
  
  var mainControls = function(blueprint3d) {
    var blueprint3d = blueprint3d;
  
    function newDesign() {
      blueprint3d.model.loadSerialized('{"floorplan":{"corners":{"f90da5e3-9e0e-eba7-173d-eb0b071e838e":{"x":204.85099999999989,"y":289.052},"da026c08-d76a-a944-8e7b-096b752da9ed":{"x":672.2109999999999,"y":289.052},"4e3d65cb-54c0-0681-28bf-bddcc7bdb571":{"x":672.2109999999999,"y":-178.308},"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2":{"x":204.85099999999989,"y":-178.308}},"walls":[{"corner1":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","corner2":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","corner2":"da026c08-d76a-a944-8e7b-096b752da9ed","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"da026c08-d76a-a944-8e7b-096b752da9ed","corner2":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","corner2":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}}],"wallTextures":[],"floorTextures":{},"newFloorTextures":{}},"items":[]}');
    }
  
    function loadDesign() {
      files = $("#loadFile").get(0).files;
      var reader  = new FileReader();
      reader.onload = function(event) {
          var data = event.target.result;
          blueprint3d.model.loadSerialized(data);
      }
      reader.readAsText(files[0]);
    }
  
    function saveDesign() {
      var data = blueprint3d.model.exportSerialized();
      var a = window.document.createElement('a');
      var blob = new Blob([data], {type : 'text'});
      a.href = window.URL.createObjectURL(blob);
      a.download = 'design.blueprint3d';
      document.body.appendChild(a)
      a.click();
      document.body.removeChild(a)
    }
  
    function init() {
      $("#new").click(newDesign);
      $("#loadFile").change(loadDesign);
      $("#saveFile").click(saveDesign);
    }
  
    init();
  }
  
  /*
   * Initialize!
   */
  
  $(document).ready(function() {
  
    // main setup
    var opts = {
      floorplannerElement: 'floorplanner-canvas',
      threeElement: '#viewer',
      threeCanvasElement: 'three-canvas',
      textureDir: "models/textures/",
      widget: false
    }
    var blueprint3d = new BP3D.Blueprint3d(opts);
  
    var modalEffects = new ModalEffects(blueprint3d);
    var viewerFloorplanner = new ViewerFloorplanner(blueprint3d);
    var contextMenu = new ContextMenu(blueprint3d);
    var sideMenu = new SideMenu(blueprint3d, viewerFloorplanner, modalEffects);
    var textureSelector = new TextureSelector(blueprint3d, sideMenu);        
    var cameraButtons = new CameraButtons(blueprint3d);
    mainControls(blueprint3d);
  
    // This serialization format needs work
    // Load a simple rectangle room
    blueprint3d.model.loadSerialized('{"floorplan":{"corners":{"f90da5e3-9e0e-eba7-173d-eb0b071e838e":{"x":204.85099999999989,"y":425.19599999999997},"da026c08-d76a-a944-8e7b-096b752da9ed":{"x":938.4030000000004,"y":425.19599999999997},"4e3d65cb-54c0-0681-28bf-bddcc7bdb571":{"x":938.4030000000004,"y":-178.308},"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2":{"x":204.85099999999989,"y":-178.308}},"walls":[{"corner1":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","corner2":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","corner2":"da026c08-d76a-a944-8e7b-096b752da9ed","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"da026c08-d76a-a944-8e7b-096b752da9ed","corner2":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","corner2":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}}],"wallTextures":[],"floorTextures":{},"newFloorTextures":{}},"items":[{"item_name":"Full Bed","item_type":1,"model_url":"models/js/ik_nordli_full.js","xpos":528.8746000125531,"ypos":50,"zpos":-71.8512536137865,"rotation":0,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false},{"item_name":"Dresser - White","item_type":1,"model_url":"models/js/we-narrow6white_baked.js","xpos":236.42779937963797,"ypos":35.611997646165,"zpos":10.814846553956983,"rotation":1.5707963267948966,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false},{"item_name":"Sofa - Grey","item_type":1,"model_url":"models/js/cb-rochelle-gray_baked.js","xpos":542.9466043823953,"ypos":42.54509923821,"zpos":209.22085824460262,"rotation":0,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false},{"item_name":"Blue Rug","item_type":8,"model_url":"models/js/cb-blue-block-60x96.js","xpos":547.6172254441368,"ypos":0.250005,"zpos":278.7058019849694,"rotation":1.5707963267948966,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false},{"item_name":"Media Console - White","item_type":1,"model_url":"models/js/cb-clapboard_baked.js","xpos":550.0665630676983,"ypos":67.88999754395999,"zpos":379.5643906279837,"rotation":-3.141592653589793,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false},{"item_name":"NYC Poster","item_type":2,"model_url":"models/js/nyc-poster2.js","xpos":547.2733810444121,"ypos":178.44665833957635,"zpos":418.9422640867963,"rotation":3.141592653589793,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false},{"item_name":"Dresser - Dark Wood","item_type":1,"model_url":"models/js/DWR_MATERA_DRESSER2.js","xpos":729.1416813475072,"ypos":57.785001860754996,"zpos":377.9423478539961,"rotation":-1.5707963267948966,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false},{"item_name":"Dresser - Dark Wood","item_type":1,"model_url":"models/js/DWR_MATERA_DRESSER2.js","xpos":380.44053738315176,"ypos":57.785001860754996,"zpos":382.2094224495513,"rotation":-1.5707963267948966,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false},{"item_name":"Bookshelf","item_type":1,"model_url":"models/js/cb-kendallbookcasewalnut_baked.js","xpos":898.1008489199137,"ypos":92.17650034119151,"zpos":-130.764699135704,"rotation":-1.5707963267948966,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false},{"item_name":"Bookshelf","item_type":1,"model_url":"models/js/cb-kendallbookcasewalnut_baked.js","xpos":903.0683650764242,"ypos":92.17650034119151,"zpos":-58.585678397265134,"rotation":-1.5707963267948966,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false},{"item_name":"Coffee Table - Wood","item_type":1,"model_url":"models/js/ik-stockholmcoffee-brown.js","xpos":889.2970697292496,"ypos":24.01483158034958,"zpos":159.30264400731681,"rotation":-1.5707963267948966,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false},{"item_name":"Chair","item_type":1,"model_url":"models/js/gus-churchchair-whiteoak.js","xpos":824.9509243992927,"ypos":39.47743068655714,"zpos":163.12786043977266,"rotation":1.5707963267948966,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false},{"item_name":"Bedside table - White","item_type":1,"model_url":"models/js/cb-archnight-white_baked.js","xpos":430.62859001953416,"ypos":31.15939942141,"zpos":-144.05385613859323,"rotation":-3.141592653589793,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false},{"item_name":"Bedside table - White","item_type":1,"model_url":"models/js/cb-archnight-white_baked.js","xpos":642.3492078599869,"ypos":31.15939942141,"zpos":-143.3600026333803,"rotation":0,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false},{"item_name":"Side Table","item_type":1,"model_url":"models/js/GUSossingtonendtable.js","xpos":872.9848304184459,"ypos":23.208047256097558,"zpos":312.3964233384347,"rotation":0,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false}]}');
  });
  