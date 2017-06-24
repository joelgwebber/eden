///<reference path='Types.ts'/>

module eden {

  import Px = PIXI;
  import Loaders = Px.loaders;

  export interface Object {
    Type: number;
    Pos: number;
    Id: number;
    Next: number;
  }

  export class Region {
    private _container: Px.Container;
    private _cellContainers: Px.Container[] = [];
    private _resources: any;
    private _objects: {[id: number]: Object} = {};

    constructor(parent: Px.Container, private _width: number, private _height: number, private _cells: number[], objects: ObjectRecord[]) {
      if (_cells.length != _width * _height * 2) {
        throw "invalid region data";
      }

      this._container = new Px.Container();
      parent.addChild(this._container);

      var pos = 0;
      for (var y = 0; y < this._height; y++) {
        for (var x = 0; x < this._width; x++) {
          var c = new Px.Container();
          this._container.addChild(c);
          c.x = x * 16; c.y = y * 16;
          this._cellContainers[pos++] = c;
        }
      }

      this.initTilemap();
      this.applyObjectRecords(objects);
    }

    object(): Px.DisplayObject {
      return this._container;
    }

    rerender() {
      for (var y = 0; y < this._height; y++) {
        for (var x = 0; x < this._width; x++) {
          this.rerenderCell(x, y);
        }
      }
    }

    updateFrom(update: MessageRegionUpdate) {
      this.applyTileRecs(update.TileRecs);
      this.applyObjectRecords(update.ObjectRecs);
      // TODO: rerenderCell(...) for each dirty cell.
      this.rerender();
    }

    private rerenderCell(x: number, y: number) {
      var containerPos = y * this._width + x;
      var c = this._cellContainers[containerPos];
      c.removeChildren();

      var cellPos = containerPos * 2;
      var floor = this._cells[cellPos];
      var objs = this._cells[cellPos + 1];
      this.renderFloor(floor, c);
      this.renderObjects(objs, c);
    }

    private applyTileRecs(recs: TileRecord[]) {
      for (var i = 0; i < recs.length; i++) {
        var rec = recs[i];
        this._cells[rec.I] = rec.V;
        // TODO: Track dirty cells
      }
    }

    private applyObjectRecords(recs: ObjectRecord[]) {
      for (var i = 0; i < recs.length; i++) {
        var rec = recs[i];
        if (rec.I in this._objects) {
          if (rec.T == 0) {
            // Remove.
            delete this._objects[rec.I];
          } else {
            // Change.
            var obj = this._objects[rec.I];
            obj.Next = rec.N;
            obj.Pos = rec.P;
            obj.Type = rec.T;
          }
        } else {
          // Add.
          this._objects[rec.I] = {
            Id: rec.I,
            Type: rec.T,
            Pos: rec.P,
            Next: rec.N
          }
        }

        // TODO: Track dirty cells
      }
    }

    private initTilemap() {
      var loader = new Loaders.Loader();
      loadFloors(loader);
      loadObjects(loader);

      loader.load((loader, resources) => {
        // TODO: There's gotta be a better way.
        for (var k in resources) {
          var textures = resources[k].textures;
          if (textures) {
            for (var kk in textures) {
              textures[kk].baseTexture.scaleMode = Px.SCALE_MODES.NEAREST;
              break;
            }
          }
        }

        this._resources = resources;
        this.rerender();
      });
    }

    private spr(sheet: string, name: string, ofsX: number = 0, ofsY: number = 0): Px.Sprite {
      var spr = new Px.Sprite(this._resources["images/" + sheet + "/" + name].texture);
      spr.x = ofsX; spr.y = ofsY;
      return spr
    }

    private renderFloor(floor: number, container: Px.Container) {
      var floor0Name = FloorNames[floor0(floor)];
      if (!floorTrans(floor)) {
        // TODO: Randomize other solid types.
        container.addChild(this.spr("floors", floor0Name + "_solid_0.png"));
      } else {
        var floor1Name = FloorNames[floor1(floor)];
        container.addChild(this.spr("floors", floor0Name + FloorGeomSuffixes[      floorTransDir(floor)] + ".png"));
        container.addChild(this.spr("floors", floor1Name + FloorGeomSuffixes[0x8 | floorTransDir(floor)] + ".png"));
      }
    }

    private renderObjects(firstObjId: number,container: Px.Container) {
      // Kind of ugly. Sort by pos to render in the right order.
      // Would like to keep this in order in the linked list, but that's a PITA.
      var objs: Object[] = [];
      while (firstObjId != 0) {
        var obj = this._objects[firstObjId];
        objs.push(obj);
        firstObjId = obj.Next;
      }
      objs.sort((a, b) => { return PosSortOrder[a.Pos] - PosSortOrder[b.Pos] });

      for (var i = 0; i < objs.length; i++) {
        var img = ObjectImages[objs[i].Type];
        if (!img) {
          log("no image found for object type", objs[i].Type);
          continue;
        }
        container.addChild(this.spr("objects", img.n + ".png", img.x, img.y));
      }
    }
  }
}
